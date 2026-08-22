/**
 * Layout Component
 * Main app shell with sticky nav, sidebar placeholder, theme toggle
 * Accessibility: proper heading hierarchy, skip-to-main link, keyboard nav
 */

import { ReactNode } from 'react';
import { Sun, Moon, SignOut } from '@phosphor-icons/react';
import { LAYOUT, TYPOGRAPHY } from '../constants/design';

interface LayoutProps {
  children: ReactNode;
  userRole: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export function Layout({
  children,
  userRole,
  isDark,
  onToggleTheme,
  onLogout,
}: LayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Skip to main content link (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:px-4 focus-visible:py-2 focus-visible:bg-blue-500 focus-visible:text-white focus-visible:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Top Navigation (sticky) */}
      <nav
        className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        style={{ height: LAYOUT.navHeight }}
      >
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FD</span>
            </div>
            <div>
              <h1 className={`${TYPOGRAPHY.pageTitle} text-lg`}>
                Fraud Detection
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Phase 1 Dashboard
              </p>
            </div>
          </div>

          {/* Nav Items - Center */}
          <div className="flex items-center gap-8">
            <a
              href="/"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Transactions
            </a>
            <a
              href="/metrics"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Metrics
            </a>
            {/* Disabled placeholders for future phases */}
            <div className="relative group">
              <button
                disabled
                className="text-sm font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-60"
              >
                Quantum (Phase 2)
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Coming in Phase 2
              </div>
            </div>
            <div className="relative group">
              <button
                disabled
                className="text-sm font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-60"
              >
                Drift (Phase 3)
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Coming in Phase 3
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun size={18} className="text-zinc-400" />
              ) : (
                <Moon size={18} className="text-zinc-600" />
              )}
            </button>

            {/* Role Badge */}
            <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase">
                {userRole}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              aria-label="Logout"
            >
              <SignOut size={18} className="text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 overflow-auto bg-white dark:bg-zinc-950"
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
