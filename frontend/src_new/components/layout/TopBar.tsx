import { Menu, Search, Bell } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

export function TopBar({ title, subtitle, onMenuClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/60 bg-ink-50/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-200 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-ink-950">{title}</h1>
            {subtitle && <p className="-mt-0.5 text-xs text-ink-500">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-ink-400" />
            <input
              placeholder="Search transactions..."
              className="w-48 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
            <kbd className="rounded border border-ink-200 px-1.5 py-0.5 text-[10px] text-ink-400">⌘K</kbd>
          </div>
          <button className="relative rounded-lg p-2 text-ink-600 hover:bg-ink-200">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
