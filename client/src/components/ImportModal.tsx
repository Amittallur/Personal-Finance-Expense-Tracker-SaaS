import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Spinner,
} from '@heroui/react';
import { UploadCloud, CheckCircle2, AlertCircle, Download, FileText } from 'lucide-react';
import { transactionApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [previewData, setPreviewData] = useState<{
    totalRows: number;
    validCount: number;
    invalidCount: number;
    validRecords: any[];
    invalidRecords: Array<{ rowNumber: number; data: any; errors: string[] }>;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsPreviewing(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const data = await transactionApi.previewImport(formData);
      setPreviewData(data);
    } catch (err: any) {
      showError(err.message || 'Failed to parse CSV file');
      setFile(null);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.validRecords.length === 0) return;

    setIsConfirming(true);
    try {
      const res = await transactionApi.confirmImport(previewData.validRecords);
      showSuccess(res.message || `Imported ${res.data?.importedCount || previewData.validRecords.length} transactions`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      handleClose();
    } catch (err: any) {
      showError(err.message || 'Failed to import transactions');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData(null);
    onClose();
  };

  const downloadSampleCSV = () => {
    const sample = `Date,Type,Category,Amount,Payment Method,Description,Notes
2026-09-25,expense,Food,650,UPI,Lunch at cafe,Team lunch
2026-09-26,income,Salary,65000,Bank Transfer,Monthly Salary Credit,Direct deposit
2026-09-27,expense,Transport,450,Credit Card,Uber commute,To office`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={open}
      onOpenChange={(isOpen) => !isOpen && handleClose()}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl',
        header: 'border-b border-slate-100 dark:border-slate-800 pb-3',
        footer: 'border-t border-slate-100 dark:border-slate-800 pt-3',
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between gap-4">
              <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Import Transactions from CSV
              </span>
              <Button
                size="sm"
                variant="flat"
                className="text-xs"
                startContent={<Download className="w-3.5 h-3.5" />}
                onPress={downloadSampleCSV}
              >
                Sample CSV
              </Button>
            </ModalHeader>

            <ModalBody className="py-4 space-y-4">
              {/* Instructions banner */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <FileText className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                <span>
                  Upload a standard CSV containing <strong>Date</strong>, <strong>Type</strong> (income/expense), <strong>Category</strong>, <strong>Amount</strong>, <strong>Payment Method</strong>, and optional description.
                </span>
              </div>

              {/* Upload Dropzone */}
              {!previewData && (
                <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                  {isPreviewing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Spinner size="md" color="primary" />
                      <span className="text-xs text-slate-500">Validating CSV rows...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-3">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Click to browse or drop your CSV file
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        Supports .csv files up to 5MB
                      </span>
                    </div>
                  )}
                </label>
              )}

              {/* Preview Content */}
              {previewData && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Chip
                      size="sm"
                      variant="flat"
                      color="success"
                      startContent={<CheckCircle2 className="w-3.5 h-3.5" />}
                      classNames={{ base: 'h-6 px-2 gap-1.5', content: 'text-xs font-semibold' }}
                    >
                      {previewData.validCount} Valid Records
                    </Chip>
                    {previewData.invalidCount > 0 && (
                      <Chip
                        size="sm"
                        variant="flat"
                        color="danger"
                        startContent={<AlertCircle className="w-3.5 h-3.5" />}
                        classNames={{ base: 'h-6 px-2 gap-1.5', content: 'text-xs font-semibold' }}
                      >
                        {previewData.invalidCount} Invalid Rows (Skipped)
                      </Chip>
                    )}
                  </div>

                  {/* Invalid records box */}
                  {previewData.invalidRecords.length > 0 && (
                    <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-xs max-h-24 overflow-y-auto space-y-1">
                      {previewData.invalidRecords.map((inv, i) => (
                        <div key={i} className="text-rose-600 dark:text-rose-400">
                          • Row {inv.rowNumber}: {inv.errors.join(', ')}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Table of valid records */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2">Method</th>
                          <th className="px-3 py-2">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {previewData.validRecords.slice(0, 50).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-2 font-mono">{formatDate(row.date)}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  row.type === 'income'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {row.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-medium">{row.categoryName}</td>
                            <td className="px-3 py-2 text-right font-semibold">
                              {formatCurrency(row.amount)}
                            </td>
                            <td className="px-3 py-2 text-slate-500">{row.paymentMethod}</td>
                            <td className="px-3 py-2 text-slate-500 truncate max-w-[120px]">
                              {row.description || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </ModalBody>

            <ModalFooter className="flex justify-between items-center">
              <Button
                variant="light"
                size="sm"
                isDisabled={isConfirming}
                onPress={handleClose}
              >
                Cancel
              </Button>
              {previewData && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="flat"
                    size="sm"
                    isDisabled={isConfirming}
                    onPress={() => setPreviewData(null)}
                  >
                    Select Another
                  </Button>
                  <Button
                    color="primary"
                    size="sm"
                    isLoading={isConfirming}
                    isDisabled={previewData.validCount === 0}
                    onPress={handleConfirmImport}
                  >
                    Confirm Import ({previewData.validCount})
                  </Button>
                </div>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
