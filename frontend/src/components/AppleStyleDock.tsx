import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  ShieldAlert,
  ReceiptText,
  Shield,
  BarChart3,
  Settings,
} from 'lucide-react';
import { Dock, DockIcon, DockItem, DockLabel } from './core/dock';
import { NavTab } from '../types';

interface AppleStyleDockProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingAlertsCount?: number;
  isCardFrozen?: boolean;
}

export function AppleStyleDock({
  currentTab,
  onSelectTab,
  pendingAlertsCount = 0,
  isCardFrozen = false,
}: AppleStyleDockProps) {
  const dockItems: {
    id: NavTab;
    title: string;
    icon: React.ReactNode;
    badge?: number;
    alertDot?: boolean;
    colorClass?: string;
  }[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5 text-white" />,
    },
    {
      id: 'card-security',
      title: 'Card Security',
      icon: <CreditCard className="h-5 w-5 text-white" />,
      alertDot: isCardFrozen,
    },
    {
      id: 'fraud-alerts',
      title: 'Fraud Alerts',
      icon: <ShieldAlert className="h-5 w-5 text-white" />,
      badge: pendingAlertsCount,
    },
    {
      id: 'transactions',
      title: 'Transactions',
      icon: <ReceiptText className="h-5 w-5 text-white" />,
    },
    {
      id: 'security-center',
      title: 'Security Center',
      icon: <Shield className="h-5 w-5 text-white" />,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: <BarChart3 className="h-5 w-5 text-white" />,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Settings className="h-5 w-5 text-white" />,
    },
  ];

  return (
    <nav aria-label="Primary Navigation" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-full px-4 pointer-events-none">
      <div className="pointer-events-auto">
        <Dock className="items-end pb-2">
          {dockItems.map((item) => {
            const isActive =
              currentTab === item.id ||
              (item.id === 'fraud-alerts' && currentTab === 'review-queue') ||
              (item.id === 'security-center' && currentTab === 'notification-logs');

            return (
              <DockItem
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                active={isActive}
                className={`aspect-square rounded-2xl transition-all duration-150 ${
                  isActive
                    ? 'bg-white/15 border border-white/20 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border border-white/5'
                }`}
              >
                <DockLabel>{item.title}</DockLabel>
                <DockIcon>{item.icon}</DockIcon>

                {/* Badge for urgent alerts */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-black">
                    {item.badge}
                  </span>
                )}

                {/* Cyan dot if card is frozen */}
                {item.alertDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-black" />
                )}
              </DockItem>
            );
          })}
        </Dock>
      </div>
    </nav>
  );
}
