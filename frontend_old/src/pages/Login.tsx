/**
 * Login Page
 * Role-based login (analyst vs admin)
 * Accessibility: semantic HTML, form labels, focus management
 */

import { useState } from 'react';
import { COMPONENTS, TYPOGRAPHY } from '../constants/design';
import { cn } from '../utils/cn';

interface LoginProps {
  onLogin: (role: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Login({ onLogin, isDark, onToggleTheme }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<'analyst' | 'admin'>(
    'analyst'
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    onLogin(selectedRole);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold">FD</span>
          </div>
          <h1 className={`${TYPOGRAPHY.pageTitle}`}>Fraud Detection</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Phase 1: Classical Model Dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <fieldset className="space-y-3">
            <legend className={`${TYPOGRAPHY.cardTitle} block`}>
              Select Your Role
            </legend>

            <div className="space-y-2">
              <label className="flex items-center p-4 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                style={{
                  borderColor:
                    selectedRole === 'analyst' ? '#3b82f6' : undefined,
                  backgroundColor:
                    selectedRole === 'analyst'
                      ? 'rgba(59, 130, 246, 0.05)'
                      : undefined,
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="analyst"
                  checked={selectedRole === 'analyst'}
                  onChange={(e) => setSelectedRole(e.target.value as 'analyst')}
                  className="w-4 h-4 cursor-pointer"
                />
                <div className="ml-3">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                    Analyst
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Review transactions, flag fraud
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                style={{
                  borderColor:
                    selectedRole === 'admin' ? '#3b82f6' : undefined,
                  backgroundColor:
                    selectedRole === 'admin'
                      ? 'rgba(59, 130, 246, 0.05)'
                      : undefined,
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={selectedRole === 'admin'}
                  onChange={(e) => setSelectedRole(e.target.value as 'admin')}
                  className="w-4 h-4 cursor-pointer"
                />
                <div className="ml-3">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                    Admin
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    View metrics, manage model
                  </div>
                </div>
              </label>
            </div>
          </fieldset>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              COMPONENTS.button.primary,
              'w-full',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Demo Note */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Demo mode:</strong> Click to enter. No credentials required.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Phase 1 Dashboard Demo
          </p>
          <button
            onClick={onToggleTheme}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
