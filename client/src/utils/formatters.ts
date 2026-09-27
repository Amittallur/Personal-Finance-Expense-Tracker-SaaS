export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'AU$',
  SGD: 'SG$',
  AED: 'AED ',
};

export const formatCurrency = (amount: number | undefined | null, currency = 'INR'): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${CURRENCY_SYMBOLS[currency] || '₹'}0`;
  }

  const symbol = CURRENCY_SYMBOLS[currency] || '₹';

  if (currency === 'INR') {
    return `${symbol}${Math.round(amount).toLocaleString('en-IN')}`;
  }

  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateStr: string | Date | undefined, formatType = 'DD/MM/YYYY'): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const monthName = d.toLocaleDateString('en-US', { month: 'short' });

  if (formatType === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  }
  if (formatType === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  }
  if (formatType === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }

  return `${monthName} ${day}, ${year}`;
};

export const formatMonthYear = (month: number, year: number): string => {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
