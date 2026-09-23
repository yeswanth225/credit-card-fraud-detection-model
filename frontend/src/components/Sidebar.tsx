import React from 'react';
import { NavTab } from '../types';
import { MagneticButton } from './MagneticButton';
import {
  LayoutDashboard,
  CreditCard,
  ShieldAlert,
  ReceiptText,
  Shield,
  BarChart3,
  Settings,
  Lock,
  X,
  Compass,
} from 'lucide-react';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isCardFrozen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingCount,
  mobileOpen,
  onCloseMobile,
  isCardFrozen = false,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: number; alertDot?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'card-security', label: 'Card Security', icon: CreditCard, alertDot: isCardFrozen },
    { id: 'fraud-alerts', label: 'Fraud Alerts', icon: ShieldAlert, badge: pendingCount },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'security-center', label: 'Security Center', icon: Shield },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: NavTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col justify-between bg-[#0E0E12] border-r border-white/[0.08] transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-400/30">
                <Shield className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-base font-semibold tracking-tight text-white">
                    FraudShield
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#181822] text-[#A1A1AA] border border-white/[0.08]">
                    LIVE
                  </span>
                </div>
                <span className="text-[11px] text-[#71717A]">Consumer Card Defense</span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-[#A1A1AA] hover:text-white rounded-lg hover:bg-[#181822] cursor-pointer"
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Map backward-compatible aliases to match active tab
              const isActive =
                currentTab === item.id ||
                (item.id === 'fraud-alerts' && currentTab === 'review-queue') ||
                (item.id === 'security-center' && currentTab === 'notification-logs');

              return (
                <MagneticButton
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  active={isActive}
                  strength={4}
                  scale={1.01}
                  className="w-full block"
                >
                  <div
                    className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#181822] text-white font-medium shadow-xs border border-white/[0.08]'
                        : 'text-[#A1A1AA] hover:text-white hover:bg-[#13131A]'
                    }`}
                  >
                    {/* Active Indicator Bar on Left */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#38BDF8] rounded-r-full" />
                    )}

                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4.5 h-4.5 transition-colors shrink-0 ${
                          isActive
                            ? 'text-[#38BDF8]'
                            : 'text-[#71717A] group-hover:text-white'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {/* Badge or Dot */}
                    <div className="flex items-center gap-1.5">
                      {item.alertDot && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400" title="Card Frozen" />
                      )}

                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </MagneticButton>
              );
            })}
          </nav>
        </div>

        {/* Protection Telemetry Bottom Box */}
        <div className="p-4 border-t border-white/[0.08] space-y-3">
          <div className="rounded-xl bg-[#121216] border border-white/[0.08] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-xs font-medium text-white">FraudShield Active</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Live
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#71717A]">
              <span>Card: •••• 4821</span>
              <span>{isCardFrozen ? 'Status: Frozen' : 'Status: Guarded'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-[#71717A] font-mono">
            <span>2-Way 3DS Active</span>
            <span>TLS 1.3 Strict</span>
          </div>
        </div>
      </aside>
    </>
  );
};
