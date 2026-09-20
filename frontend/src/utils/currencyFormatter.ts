/**
 * Indian Rupee (INR) Currency and Number Formatter
 * Implements Indian numbering system (Lakhs and Crores grouping, e.g., ₹1,25,000)
 */

export interface FormatINROptions {
  showSymbol?: boolean;
  decimals?: number;
}

/**
 * Format an amount into standard Indian currency representation (e.g. ₹1,25,000 or ₹4,89,200.50)
 */
export function formatINR(amount: number, options: FormatINROptions = {}): string {
  const { showSymbol = true, decimals = 0 } = options;
  if (amount === undefined || amount === null || isNaN(amount)) {
    return showSymbol ? '₹0' : '0';
  }

  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `₹${formatted}` : formatted;
}

/**
 * Compact Indian currency formatting for chart axes and high-density labels:
 * >= 1,00,00,000 -> "₹X.XX Cr"
 * >= 1,00,000 -> "₹X.X L"
 * >= 1,000 -> "₹Xk"
 */
export function formatINRCompact(amount: number, showSymbol = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return showSymbol ? '₹0' : '0';
  }

  const prefix = showSymbol ? '₹' : '';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    // 1 Crore = 10,000,000
    const cr = abs / 10000000;
    return `${sign}${prefix}${cr >= 10 ? cr.toFixed(1) : cr.toFixed(2)} Cr`;
  }

  if (abs >= 100000) {
    // 1 Lakh = 100,000
    const lakh = abs / 100000;
    return `${sign}${prefix}${lakh >= 10 ? lakh.toFixed(1) : lakh.toFixed(2)} L`;
  }

  if (abs >= 1000) {
    const k = abs / 1000;
    return `${sign}${prefix}${k.toFixed(0)}k`;
  }

  return `${sign}${prefix}${abs.toLocaleString('en-IN')}`;
}

/**
 * Format raw numbers with standard Indian grouping without currency symbol
 */
export function formatNumberIN(val: number, decimals = 0): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return val.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
