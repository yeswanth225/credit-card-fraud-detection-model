import React, { useState } from 'react';
import { motion } from 'motion/react';
import { StatCard } from '../StatCard';
import { TransactionsTable } from '../TransactionsTable';
import { DashboardIntroSection } from '../DashboardIntroSection';
import { ActiveCardVerificationHero } from '../ActiveCardVerificationHero';
import { Transaction } from '../../types';
import { formatINR, formatINRCompact } from '../../utils/currencyFormatter';
import {
  CreditCard,
  ShieldCheck,
  Clock,
  Percent,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { HOURLY_VELOCITY_DATA } from '../../data/mockData';

interface DashboardViewProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  onSimulateNewTransaction?: () => void;
  onTriggerPushConfirmation?: () => void;
  searchFilter: string;
  highlightedTxId?: string | null;
  highlightedOutcome?: 'approved' | 'declined' | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  onSelectTransaction,
  searchFilter,
  highlightedTxId,
  highlightedOutcome,
}) => {
  // Compute dynamic stats in INR
  const totalApproved = transactions.filter((t) => t.status === 'approved').length;
  const pendingCount = transactions.filter((t) => t.status === 'step-up').length;
  const declinedList = transactions.filter((t) => t.status === 'declined');
  const fraudAmountBlocked = declinedList.reduce((acc, curr) => acc + curr.amount, 0) + 1245000; // base offset + session in INR
  const totalVolumeAmount = transactions.reduce((acc, curr) => acc + curr.amount, 0) + 285000000; // ~28.5 Cr volume

  const [isIntroCollapsed, setIsIntroCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fraudshield_dashboard_intro_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleIntroCollapse = () => {
    setIsIntroCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('fraudshield_dashboard_intro_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-semibold text-white tracking-tight">
            Security Intelligence & Risk Stream
          </h1>
          <p className="text-xs sm:text-sm text-[#88889C] mt-1">
            Real-time automated authorization decisioning and 3DS challenge orchestration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141418] border border-[#23232A] text-xs text-[#A4A4B4]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
            </span>
            <span className="font-mono text-xs text-white">Live Stream Active</span>
            <span className="text-[#646476] font-mono text-[11px]">• 12ms p99</span>
          </div>
        </div>
      </div>

      {/* HERO SECTION: Autonomous Protection Explainer + 3D Active Card Verification Centerpiece */}
      {isIntroCollapsed ? (
        <div className="w-full">
          <DashboardIntroSection
            isCollapsed={true}
            onToggleCollapse={toggleIntroCollapse}
          />
        </div>
      ) : (
        <div
          id="dashboard-intro-hero-container"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center"
        >
          <div className="lg:col-span-7 xl:col-span-8">
            <DashboardIntroSection
              isCollapsed={false}
              onToggleCollapse={toggleIntroCollapse}
            />
          </div>
          <div className="lg:col-span-5 xl:col-span-4 flex items-center justify-center">
            <ActiveCardVerificationHero containerElementId="dashboard-intro-hero-container" />
          </div>
        </div>
      )}

      {/* Responsive Grid of 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Transactions Today */}
        <StatCard
          index={0}
          title="Total Transactions Today"
          value={48291 + transactions.length - 10}
          suffix=""
          subValue={`${formatINRCompact(totalVolumeAmount)} processed`}
          trend={{
            direction: 'up',
            value: '+12.4%',
            label: 'vs yesterday',
            isGood: true,
          }}
          icon={CreditCard}
        />

        {/* 2. Fraud Blocked Today */}
        <StatCard
          index={1}
          title="Fraud Blocked Today"
          value={fraudAmountBlocked}
          prefix="₹"
          decimals={0}
          subValue={`${38 + declinedList.length - 2} attacks intercepted`}
          trend={{
            direction: 'down',
            value: '-4.1%',
            label: 'attack volume',
            isGood: true,
          }}
          icon={ShieldCheck}
        />

        {/* 3. Pending Step-Up Confirmations */}
        <StatCard
          index={2}
          title="Pending Step-Ups"
          value={pendingCount}
          suffix=""
          subValue="Active 3DS / Biometric queue"
          badge={{
            text: 'Live Triage',
            color: 'amber',
            pulse: true,
          }}
          icon={Clock}
        />

        {/* 4. False-Positive Rate */}
        <StatCard
          index={3}
          title="False-Positive Rate"
          value={0.08}
          decimals={2}
          suffix="%"
          subValue="Benchmark < 0.15% target"
          trend={{
            direction: 'down',
            value: '-0.02%',
            label: 'past 7 days',
            isGood: true,
          }}
          icon={Percent}
        />
      </div>

      {/* Hourly Velocity & Anomaly Telemetry Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl bg-[#131316] border border-[#23232A] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#9E9EA8] tracking-wider uppercase">
                24-Hour Velocity & Attack Distribution
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/25">
                Composite Timeline
              </span>
            </div>
            <p className="text-xs text-[#808092] mt-0.5">
              Authorization throughput (INR) mapped against anomalous velocity triggers
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#6366F1]" />
              <span className="text-[#A2A2B4]">Volume (₹)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]" />
              <span className="text-[#A2A2B4]">Attacks Blocked</span>
            </div>
          </div>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HOURLY_VELOCITY_DATA} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                stroke="#686878"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#686878"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatINRCompact(val)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#16161C',
                  borderColor: '#292936',
                  borderRadius: '8px',
                  color: '#EDEDED',
                  fontSize: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                }}
                formatter={(val: any, name: any) => {
                  if (name === 'totalVolume') return [formatINR(Number(val)), 'Processed Volume'];
                  return [val, 'Fraud Events'];
                }}
              />
              <Area
                type="monotone"
                dataKey="totalVolume"
                stroke="#6366F1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#volumeGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <TransactionsTable
          transactions={transactions}
          onSelectTransaction={onSelectTransaction}
          searchFilter={searchFilter}
          highlightedTxId={highlightedTxId}
          highlightedOutcome={highlightedOutcome}
        />
      </motion.div>
    </div>
  );
};
