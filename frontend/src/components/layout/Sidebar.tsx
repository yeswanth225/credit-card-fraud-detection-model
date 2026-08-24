import { LayoutDashboard, ScanSearch, Receipt, BarChart3, Gauge, ShieldCheck, X } from 'lucide-react';

export type PageId = 'dashboard' | 'detect' | 'history' | 'analytics' | 'model';

interface SidebarProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'detect', label: 'Detect Fraud', icon: ScanSearch },
  { id: 'history', label: 'Transactions', icon: Receipt },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'model', label: 'Model Performance', icon: Gauge },
];

export function Sidebar({ current, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-ink-950/30 backdrop-blur-[2px] lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-ink-200/60 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950">
              <ShieldCheck className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-ink-950">Sentinel</p>
              <p className="-mt-0.5 text-[10px] text-ink-400">Fraud Detection</p>
            </div>
          </div>
          <button onClick={onCloseMobile} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400">Menu</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-ink-950 text-white'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-ink-100 p-3">
          <div className="rounded-lg bg-ink-50 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-200 text-xs font-bold text-ink-700">
                AK
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-ink-900">Alex Kim</p>
                <p className="truncate text-[10px] text-ink-400">Risk Analyst</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
