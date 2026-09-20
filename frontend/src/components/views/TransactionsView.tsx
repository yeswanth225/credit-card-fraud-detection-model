import React, { useState } from 'react';
import { Transaction } from '../../types';
import { TransactionsTable } from '../TransactionsTable';
import { DatePickerPopover } from '../DatePickerPopover';
import { Download, Filter, Search, Calendar, RefreshCw } from 'lucide-react';
import { formatFullDate } from '../../utils/dateUtils';

interface TransactionsViewProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  searchFilter: string;
  highlightedTxId?: string | null;
  highlightedOutcome?: 'approved' | 'declined' | null;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onSelectTransaction,
  searchFilter,
  highlightedTxId,
  highlightedOutcome,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>('');

  const handleSelectDate = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const count = transactions.filter((tx) => {
        if (selectedBrand !== 'all' && tx.cardholder.cardBrand.toLowerCase() !== selectedBrand.toLowerCase()) {
          return false;
        }
        if (minAmount && tx.amount < parseFloat(minAmount)) {
          return false;
        }
        const txD = new Date(tx.timestamp);
        return (
          txD.getFullYear() === date.getFullYear() &&
          txD.getMonth() === date.getMonth() &&
          txD.getDate() === date.getDate()
        );
      }).length;
      setAriaAnnouncement(
        `Showing ${count} transaction${count === 1 ? '' : 's'} for ${formatFullDate(date)}`
      );
    } else {
      setAriaAnnouncement('Cleared date filter. Showing all transactions.');
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (selectedBrand !== 'all' && tx.cardholder.cardBrand.toLowerCase() !== selectedBrand.toLowerCase()) {
      return false;
    }
    if (minAmount && tx.amount < parseFloat(minAmount)) {
      return false;
    }
    if (selectedDate) {
      const txD = new Date(tx.timestamp);
      if (
        txD.getFullYear() !== selectedDate.getFullYear() ||
        txD.getMonth() !== selectedDate.getMonth() ||
        txD.getDate() !== selectedDate.getDate()
      ) {
        return false;
      }
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = 'ID,Timestamp,Merchant,Cardholder,Amount,Status,RiskScore\n';
    const rows = filteredTransactions
      .map(
        (t) =>
          `"${t.id}","${t.timestamp}","${t.merchant.name}","${t.cardholder.name}",${t.amount},"${t.status}",${t.riskScore}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraudshield_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Screen Reader Aria-Live Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {ariaAnnouncement}
      </div>

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-semibold text-white tracking-tight">
            Transaction Ledger & Historical Audit
          </h1>
          <p className="text-xs sm:text-sm text-[#88889C] mt-1">
            Query across historical card authorizations, token telemetry, and decision outcomes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141418] hover:bg-[#1A1A22] text-[#D0D0DC] hover:text-white border border-[#23232A] text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#88889C]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#131316] border border-[#23232A] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Card Brand Filter */}
          <div className="flex items-center gap-1.5 text-[#88889C]">
            <Filter className="w-3.5 h-3.5" />
            <span>Card Brand:</span>
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0E0E11] border border-[#1F1F26]">
            {['all', 'visa', 'mastercard', 'amex'].map((brand) => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  selectedBrand === brand
                    ? 'bg-[#1C1C24] text-white font-medium shadow-xs'
                    : 'text-[#7A7A8C] hover:text-white'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>

          {/* Min Amount Filter */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#202028]">
            <span className="text-[#88889C]">Min Amount:</span>
            <input
              type="number"
              placeholder="$0.00"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-20 bg-[#0E0E11] border border-[#23232A] rounded px-2 py-1 text-white font-mono placeholder-[#505060] focus:outline-none focus:border-[#6366F1]"
            />
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#202028]">
            <span className="text-[#88889C]">Date:</span>
            <DatePickerPopover
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              transactions={transactions}
            />
          </div>
        </div>

        <div className="text-[11px] text-[#707080] font-mono">
          Showing {filteredTransactions.length} records matching criteria
        </div>
      </div>

      {/* Main Table */}
      <TransactionsTable
        transactions={filteredTransactions}
        onSelectTransaction={onSelectTransaction}
        searchFilter={searchFilter}
        highlightedTxId={highlightedTxId}
        highlightedOutcome={highlightedOutcome}
        selectedDate={selectedDate}
        onClearDateFilter={() => handleSelectDate(null)}
      />
    </div>
  );
};
