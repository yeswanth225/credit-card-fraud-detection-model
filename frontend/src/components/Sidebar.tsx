import React from 'react';
import { NavTab } from '../types';
import { MagneticButton } from './MagneticButton';
import {
  LayoutDashboard,
  ReceiptText,
  ShieldAlert,
  MessageSquareText,
  BarChart3,
  Settings,
  Shield,
  Activity,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingCount,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'review-queue', label: 'Review Queue', icon: ShieldAlert, badge: pendingCount },
    { id: 'notification-logs', label: 'Notification Logs', icon: MessageSquareText },
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
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col justify-between bg-[#0E0E11] border-r border-[#23232A] transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#1F1F26]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/30">
                <Shield className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-base font-semibold tracking-tight text-white">
                    FraudShield
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#1C1C22] text-[#8C8CA0] border border-[#2B2B36]">
                    Prod
                  </span>
                </div>
                <span className="text-[11px] text-[#6E6E80]">Card Risk Shield</span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-[#8E8EA0] hover:text-white rounded-lg hover:bg-[#18181D]"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <MagneticButton
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  active={isActive}
                  strength={5}
                  scale={1.01}
                  className="w-full block"
                >
                  <div
                    className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-colors duration-200 ${
                      isActive
                        ? 'bg-[#181820] text-white font-medium shadow-xs border border-[#2B2B38]'
                        : 'text-[#9E9EA8] hover:text-white hover:bg-[#131318]'
                    }`}
                  >
                    {/* Active Indigo Indicator Bar on Left */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#6366F1] rounded-r-full" />
                    )}

                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4.5 h-4.5 transition-colors ${
                          isActive
                            ? 'text-[#6366F1]'
                            : 'text-[#7A7A8C] group-hover:text-[#EDEDED]'
                        }`}
                      />
                      <span className="tracking-wide">{item.label}</span>
                    </div>

                    {/* Badge */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 text-xs font-mono font-medium rounded-full ${
                          isActive
                            ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                            : 'bg-[#1D1D24] text-[#F59E0B] border border-[#2D2D38]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </MagneticButton>
              );
            })}
          </nav>
        </div>

        {/* Engine Telemetry Bottom Box */}
        <div className="p-4 border-t border-[#1F1F26] space-y-3">
          <div className="rounded-lg bg-[#131317] border border-[#212128] p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
                </span>
                <span className="text-xs font-medium text-[#D0D0DC]">Rule Engine</span>
              </div>
              <span className="text-[11px] font-mono text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded border border-[#22C55E]/20">
                12ms
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#78788A]">
              <span>Model v4.2-Flash</span>
              <span>99.99% Uptime</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-[#606070]">
            <span>UTC 18:59:12</span>
            <span>TLS 1.3 Strict</span>
          </div>
        </div>
      </aside>
    </>
  );
};
