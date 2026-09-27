const multer = require('multer');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// Multer memory storage config
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed for import.'));
    }
  },
});

// @desc    Export transactions as CSV
// @route   GET /api/transactions/export/csv
// @access  Private
const exportCSV = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate('categoryId', 'name')
      .sort({ date: -1 });

    const rows = [
      ['Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Description', 'Notes'],
    ];

    transactions.forEach((t) => {
      rows.push([
        new Date(t.date).toISOString().split('T')[0],
        t.type,
        t.categoryId ? t.categoryId.name : 'Uncategorized',
        t.amount,
        t.paymentMethod,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ]);
    });

    const csvContent = rows.map((r) => r.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

// @desc    Export transactions as Excel (.xlsx)
// @route   GET /api/transactions/export/excel
// @access  Private
const exportExcel = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate('categoryId', 'name')
      .sort({ date: -1 });

    const data = transactions.map((t) => ({
      Date: new Date(t.date).toISOString().split('T')[0],
      Type: t.type.toUpperCase(),
      Category: t.categoryId ? t.categoryId.name : 'Uncategorized',
      Amount: t.amount,
      'Payment Method': t.paymentMethod,
      Description: t.description || '',
      Notes: t.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    // Auto-fit column widths
    const maxProps = [{ wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 30 }, { wch: 30 }];
    worksheet['!cols'] = maxProps;

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.xlsx"');
    res.status(200).send(buffer);
  } catch (err) {
    next(err);
  }
};

// @desc    Preview CSV transactions import with validation
// @route   POST /api/transactions/import/preview
// @access  Private
const previewImportCSV = async (req, res, next) => {
  try {
    let fileBuffer;
    if (req.file) {
      fileBuffer = req.file.buffer;
    } else if (req.body.csvText) {
      fileBuffer = Buffer.from(req.body.csvText);
    } else {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file or provide csvText' });
    }

    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Get user categories for matching
    const userCategories = await Category.find({ userId: req.user._id });
    const catMap = {};
    userCategories.forEach((c) => {
      catMap[c.name.toLowerCase()] = c;
    });

    const validRecords = [];
    const invalidRecords = [];

    const allowedPaymentMethods = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'];

    records.forEach((row, index) => {
      const rowNum = index + 2; // header is row 1
      const errors = [];

      // Extract row fields (case-insensitive keys)
      const dateKey = Object.keys(row).find((k) => /date/i.test(k));
      const typeKey = Object.keys(row).find((k) => /type/i.test(k));
      const categoryKey = Object.keys(row).find((k) => /cat/i.test(k));
      const amountKey = Object.keys(row).find((k) => /amount/i.test(k));
      const paymentMethodKey = Object.keys(row).find((k) => /payment|method/i.test(k));
      const descKey = Object.keys(row).find((k) => /desc/i.test(k));
      const notesKey = Object.keys(row).find((k) => /note/i.test(k));

      const rawDate = row[dateKey];
      const rawType = (row[typeKey] || '').toLowerCase().trim();
      const rawCategory = (row[categoryKey] || '').trim();
      const rawAmount = parseFloat(row[amountKey]);
      const rawPaymentMethod = (row[paymentMethodKey] || 'Other').trim();
      const rawDesc = (row[descKey] || '').trim();
      const rawNotes = (row[notesKey] || '').trim();

      // Validate date
      const parsedDate = new Date(rawDate);
      if (!rawDate || isNaN(parsedDate.getTime())) {
        errors.push('Invalid date format');
      }

      // Validate type
      if (!['income', 'expense'].includes(rawType)) {
        errors.push('Type must be either "income" or "expense"');
      }

      // Validate amount
      if (isNaN(rawAmount) || rawAmount <= 0) {
        errors.push('Amount must be a positive number');
      }

      // Validate or resolve category
      let categoryObj = catMap[rawCategory.toLowerCase()];
      if (!categoryObj) {
        // Fallback to "Other" category of matched type
        const fallback = userCategories.find(
          (c) => c.type === rawType && c.name.toLowerCase() === 'other'
        );
        if (fallback) {
          categoryObj = fallback;
        } else {
          errors.push(`Category "${rawCategory}" not found`);
        }
      }

      // Validate payment method
      let matchedPaymentMethod = allowedPaymentMethods.find(
        (pm) => pm.toLowerCase() === rawPaymentMethod.toLowerCase()
      ) || 'Other';

      if (errors.length > 0) {
        invalidRecords.push({
          rowNumber: rowNum,
          data: row,
          errors,
        });
      } else {
        validRecords.push({
          date: parsedDate.toISOString(),
          type: rawType,
          categoryId: categoryObj._id,
          categoryName: categoryObj.name,
          categoryColor: categoryObj.color,
          amount: rawAmount,
          paymentMethod: matchedPaymentMethod,
          description: rawDesc,
          notes: rawNotes,
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalRows: records.length,
        validCount: validRecords.length,
        invalidCount: invalidRecords.length,
        validRecords,
        invalidRecords,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Confirm and save validated CSV records
// @route   POST /api/transactions/import/confirm
// @access  Private
const confirmImportCSV = async (req, res, next) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid records provided for import' });
    }

    const docsToInsert = records.map((r) => ({
      userId: req.user._id,
      date: new Date(r.date),
      type: r.type,
      categoryId: r.categoryId,
      amount: parseFloat(r.amount),
      paymentMethod: r.paymentMethod || 'Other',
      description: r.description || '',
      notes: r.notes || '',
    }));

    const inserted = await Transaction.insertMany(docsToInsert);

    res.status(201).json({
      success: true,
      data: {
        importedCount: inserted.length,
      },
      message: `Successfully imported ${inserted.length} transactions.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  upload,
  exportCSV,
  exportExcel,
  previewImportCSV,
  confirmImportCSV,
};
