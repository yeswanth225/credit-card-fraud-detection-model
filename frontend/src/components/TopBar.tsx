import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, CheckCircle2, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { NotificationItem } from '../types';

interface TopBarProps {
  onOpenMobileNav: () => void;
  notifications: NotificationItem[];
  onSelectTransaction?: (txId: string) => void;
  onTriggerPushConfirmation?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSignOut?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileNav,
  notifications,
  onSelectTransaction,
  searchQuery,
  onSearchChange,
  onSignOut,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const pendingCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-[#0A0A0B]/85 backdrop-blur-md border-b border-[#1F1F26] px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left section: mobile hamburger & search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg text-[#9E9EA8] hover:text-white hover:bg-[#141418] transition-colors"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606070]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search merchant, card token, IP, or ID..."
            className="w-full bg-[#131317] border border-[#23232B] rounded-lg pl-9 pr-12 py-1.5 text-sm text-[#E2E2EC] placeholder-[#606070] focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/25 transition-colors"
          />
          <kbd className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-[#78788C] bg-[#1B1B22] border border-[#292934] rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right section: System telemetry status, Notification bell, User avatar */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Live Telemetry Pill */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#141418] border border-[#23232A] text-xs text-[#A4A4B4]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
          </span>
          <span className="font-mono text-[11px] text-[#C0C0D0]">Live Intercept Active</span>
        </div>

        {/* Notification Bell with animated pending badge */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-[#9E9EA8] hover:text-white hover:bg-[#141418] border border-transparent hover:border-[#23232B] transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {pendingCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-80" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F59E0B]" />
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#131317] border border-[#272732] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-[#1F1F28] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-sm font-semibold text-white">
                    Risk Alerts & Step-Ups
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25">
                    {pendingCount} Pending
                  </span>
                </div>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs text-[#78788A] hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#1D1D26]">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (notif.transactionId && onSelectTransaction) {
                        onSelectTransaction(notif.transactionId);
                        setNotificationsOpen(false);
                      }
                    }}
                    className={`p-3.5 hover:bg-[#191922] transition-colors cursor-pointer flex gap-3 ${
                      notif.unread ? 'bg-[#15151C]' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {notif.type === 'alert' && (
                        <div className="w-6 h-6 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {notif.type === 'warning' && (
                        <div className="w-6 h-6 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {notif.type === 'info' && (
                        <div className="w-6 h-6 rounded-full bg-[#6366F1]/15 border border-[#6366F1]/30 flex items-center justify-center text-[#6366F1]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-medium text-white truncate">
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-[#6E6E80] shrink-0 font-mono">
                          {notif.timeAgo}
                        </span>
                      </div>
                      <p className="text-xs text-[#9090A0] mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1 sm:pl-2 sm:pr-2.5 rounded-lg hover:bg-[#141418] border border-transparent hover:border-[#23232B] transition-colors"
            aria-label="User profile options"
          >
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#1E1E26] to-[#2E2E3C] border border-[#3A3A4A] flex items-center justify-center text-xs font-semibold text-white">
              AV
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-[#0A0A0B]" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-[#EDEDED] leading-none">
                Alex Vance
              </span>
              <span className="text-[10px] text-[#7A7A8E] mt-1 leading-none">
                SecOps Lead
              </span>
            </div>
          </button>

          {/* User Popover Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#131317] border border-[#272732] shadow-2xl z-50 p-2 text-xs text-[#A8A8B8] animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-[#1E1E28]">
                <p className="font-medium text-white">Alex Vance</p>
                <p className="text-[11px] text-[#707082] font-mono mt-0.5">
                  alex.vance@fraudshield.internal
                </p>
              </div>
              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full text-left px-3 py-1.5 rounded-md hover:bg-[#1A1A22] text-[#D0D0DC] hover:text-white transition-colors"
                >
                  Security Operations Center
                </button>
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full text-left px-3 py-1.5 rounded-md hover:bg-[#1A1A22] text-[#D0D0DC] hover:text-white transition-colors"
                >
                  Audit Trail & Compliance
                </button>
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full text-left px-3 py-1.5 rounded-md hover:bg-[#1A1A22] text-[#D0D0DC] hover:text-white transition-colors"
                >
                  API Keys & Webhooks
                </button>
              </div>
              <div className="pt-1 mt-1 border-t border-[#1E1E28]">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onSignOut?.();
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-md hover:bg-[#1A1A22] text-[#EF4444] transition-colors cursor-pointer"
                >
                  Sign Out Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
