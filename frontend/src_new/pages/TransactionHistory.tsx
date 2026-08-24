import { useEffect, useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, CreditCard, MapPin, Clock, RotateCw, Globe } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/FormInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { fetchTransactions } from '@/lib/api';
import { formatCurrency, formatDateTime, formatPercent, hourLabel, dayLabel, categoryLabel, cardTypeLabel } from '@/lib/format';
import type { Transaction, TransactionStatus } from '@/lib/types';

const PAGE_SIZE = 10;

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [amountFilter, setAmountFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchTransactions().then((data) => {
      setTransactions(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (search) {
        const q = search.toLowerCase();
        if (!t.merchant.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q) && !t.location.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (amountFilter === 'lt50' && t.amount >= 50) return false;
      if (amountFilter === '50to200' && (t.amount < 50 || t.amount > 200)) return false;
      if (amountFilter === 'gt200' && t.amount <= 200) return false;
      return true;
    });
  }, [transactions, search, statusFilter, amountFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const columns: Column<Transaction>[] = [
    {
      key: 'merchant',
      header: 'Merchant',
      render: (t) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-100">
            <CreditCard className="h-3.5 w-3.5 text-ink-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{t.merchant}</p>
            <p className="truncate text-xs text-ink-400">{categoryLabel(t.merchantCategory)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (t) => <span className="font-medium tabular-nums text-ink-900">{formatCurrency(t.amount)}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      render: (t) => <span className="text-ink-600">{t.location}</span>,
    },
    {
      key: 'time',
      header: 'Date & Time',
      render: (t) => <span className="text-ink-500">{formatDateTime(t.timestamp)}</span>,
    },
    {
      key: 'confidence',
      header: 'Confidence',
      align: 'right',
      render: (t) => (
        <span className="tabular-nums text-ink-600">{formatPercent(t.confidence)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (t) => <StatusBadge status={t.status} />,
    },
  ];

  return (
    <div className="space-y-4 p-5 lg:p-8">
      <Card>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-ink-400" />
            <input
              placeholder="Search merchant, ID, or location..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-3">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="w-auto min-w-[140px]"
            >
              <option value="all">All Statuses</option>
              <option value="fraudulent">Fraudulent</option>
              <option value="legitimate">Legitimate</option>
              <option value="review">Under Review</option>
            </Select>
            <Select
              value={amountFilter}
              onChange={(e) => { setAmountFilter(e.target.value); setPage(0); }}
              className="w-auto min-w-[140px]"
            >
              <option value="all">All Amounts</option>
              <option value="lt50">Under $50</option>
              <option value="50to200">$50 – $200</option>
              <option value="gt200">Over $200</option>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-ink-400">Loading transactions...</div>
        ) : (
          <DataTable
            columns={columns}
            data={pageData}
            onRowClick={setSelected}
            emptyMessage="No transactions match your filters"
          />
        )}

        <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
          <p className="text-xs text-ink-500">
            Showing {pageData.length > 0 ? page * PAGE_SIZE + 1 : 0}–{page * PAGE_SIZE + pageData.length} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-ink-200 p-1.5 text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-ink-500">
              Page {page + 1} of {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-ink-200 p-1.5 text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Transaction Details">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-ink-950">{formatCurrency(selected.amount)}</p>
                <p className="text-sm text-ink-500">{selected.merchant}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="rounded-lg border border-ink-100 bg-ink-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500">Confidence Score</span>
                <span className="text-sm font-bold tabular-nums text-ink-950">{formatPercent(selected.confidence)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-200">
                <div
                  className="h-full rounded-full bg-ink-950 transition-all duration-700"
                  style={{ width: `${selected.confidence * 100}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-ink-500">Risk Score</span>
                <span className="text-xs font-medium tabular-nums text-accent-600">{formatPercent(selected.riskScore)}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Transaction Info</p>
              <dl className="divide-y divide-ink-50">
                <DetailRow label="Transaction ID" value={selected.id} mono />
                <DetailRow label="Date & Time" value={formatDateTime(selected.timestamp)} />
                <DetailRow label="Card Type" value={cardTypeLabel(selected.cardType)} />
                <DetailRow label="Category" value={categoryLabel(selected.merchantCategory)} />
                <DetailRow label="Location" value={selected.location} icon={<MapPin className="h-3 w-3" />} />
              </dl>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Risk Features</p>
              <dl className="divide-y divide-ink-50">
                <DetailRow label="Time of Day" value={hourLabel(selected.features.hourOfDay)} icon={<Clock className="h-3 w-3" />} />
                <DetailRow label="Day of Week" value={dayLabel(selected.features.dayOfWeek)} />
                <DetailRow label="Distance from Home" value={`${selected.features.distanceFromHome} mi`} />
                <DetailRow label="Distance from Last Tx" value={`${selected.features.distanceFromLastTx} mi`} />
                <DetailRow label="Ratio to Median" value={`${selected.features.ratioToMedianAmount}x`} />
                <DetailRow label="International" value={selected.features.isInternational ? 'Yes' : 'No'} icon={<Globe className="h-3 w-3" />} />
                <DetailRow label="Chip Auth" value={selected.features.isChipAuth ? 'Yes' : 'No'} />
                <DetailRow label="Retry Attempts" value={String(selected.features.retryAttempts)} icon={<RotateCw className="h-3 w-3" />} />
              </dl>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function DetailRow({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="flex items-center gap-1.5 text-xs text-ink-500">
        {icon}
        {label}
      </dt>
      <dd className={`text-sm text-ink-900 ${mono ? 'font-mono text-xs' : 'font-medium'}`}>{value}</dd>
    </div>
  );
}
