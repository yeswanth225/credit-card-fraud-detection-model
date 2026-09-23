import React, { useState, useRef, useEffect } from 'react';
import { Shield, Search, Bell, CheckCircle2, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { NotificationItem } from '../types';

interface TopBarProps {
  notifications: NotificationItem[];
  onSelectTransaction?: (txId: string) => void;
  onTriggerPushConfirmation?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSignOut?: () => void;
  onNavigateHome?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  notifications,
  onSelectTransaction,
  searchQuery,
  onSearchChange,
  onSignOut,
  onNavigateHome,
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
    <header className="sticky top-0 z-30 h-16 w-full bg-[#000000]/90 backdrop-blur-xl border-b border-white/[0.04] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left section: Brand logo & Global Search */}
      <div className="flex items-center gap-4 sm:gap-6 flex-1 max-w-2xl">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 group cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
              FraudShield
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-white/5 text-[#909099] border border-white/5">
                PRO
              </span>
            </span>
          </div>
        </button>

        {/* Global Search Input */}
        <div className="relative w-full max-w-md hidden xs:block sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5E5E68]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search merchant, token, IP, or ID..."
            className="w-full bg-[#0A0A0C] border border-white/[0.05] rounded-xl pl-9 pr-12 py-1.5 text-xs text-[#EDEDED] placeholder-[#5E5E68] focus:outline-none focus:border-white/20 transition-all"
          />
          <kbd className="hidden md:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-[#5E5E68] bg-[#111114] border border-white/[0.05] rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right section: Notification bell, User avatar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notification Bell with animated pending badge */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.05] text-white transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4 text-white" />
            {pendingCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0A0A0C] border border-white/[0.08] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-sm font-semibold text-white">
                    Risk Alerts & Step-Ups
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {pendingCount} Pending
                  </span>
                </div>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs text-[#5E5E68] hover:text-white transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (notif.transactionId && onSelectTransaction) {
                        onSelectTransaction(notif.transactionId);
                        setNotificationsOpen(false);
                      }
                    }}
                    className={`p-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer flex gap-3 ${
                      notif.unread ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                        {notif.type === 'alert' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                        {notif.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                        {notif.type === 'info' && <ShieldCheck className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-medium text-white truncate">
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-[#5E5E68] shrink-0 font-mono">
                          {notif.timeAgo}
                        </span>
                      </div>
                      <p className="text-xs text-[#909099] mt-0.5 line-clamp-2 leading-relaxed">
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
            className="flex items-center gap-2.5 p-1 sm:pl-1.5 sm:pr-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors cursor-pointer"
            aria-label="User profile options"
          >
            <div className="relative w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-semibold text-white">
              EV
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-white leading-none">
                Eleanor Vance
              </span>
              <span className="text-[10px] text-[#909099] mt-1 leading-none">
                Cardholder
              </span>
            </div>
          </button>

          {/* User Popover Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0A0A0C] border border-white/[0.08] shadow-2xl z-50 p-2 text-xs text-[#909099] animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-white/[0.05]">
                <p className="font-semibold text-white">Eleanor Vance</p>
                <p className="text-[11px] text-[#5E5E68] font-mono mt-0.5">
                  eleanor.vance@fraudshield.me
                </p>
              </div>
              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-white/5 text-[#EDEDED] hover:text-white transition-colors cursor-pointer"
                >
                  Security Preferences
                </button>
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-white/5 text-[#EDEDED] hover:text-white transition-colors cursor-pointer"
                >
                  Card Verification Settings
                </button>
              </div>
              <div className="pt-1 mt-1 border-t border-white/[0.05]">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onSignOut?.();
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-white/5 text-red-400 transition-colors cursor-pointer"
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
