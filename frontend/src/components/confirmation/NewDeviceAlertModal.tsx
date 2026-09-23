import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Laptop,
  Globe,
  Clock,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  X,
  Info,
} from 'lucide-react';
import { DeviceRecord } from '../../hooks/useDeviceSession';

interface NewDeviceAlertModalProps {
  isOpen: boolean;
  device: DeviceRecord | null;
  accountHomeRegion: string;
  onApprove: () => void;
  onRevoke: () => void;
  onDismiss: () => void;
}

export const NewDeviceAlertModal: React.FC<NewDeviceAlertModalProps> = ({
  isOpen,
  device,
  accountHomeRegion,
  onApprove,
  onRevoke,
  onDismiss,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const approveBtnRef = useRef<HTMLButtonElement>(null);
  const revokeBtnRef = useRef<HTMLButtonElement>(null);

  const prefersReducedMotion = useRef<boolean>(false);
  if (typeof window !== 'undefined') {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Accessibility: Focus trap and Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    // Focus approve button by default on open
    setTimeout(() => {
      approveBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
        return;
      }

      if (e.key === 'Tab') {
        if (!approveBtnRef.current || !revokeBtnRef.current) return;
        const active = document.activeElement;

        if (e.shiftKey && active === revokeBtnRef.current) {
          e.preventDefault();
          approveBtnRef.current.focus();
        } else if (!e.shiftKey && active === approveBtnRef.current) {
          e.preventDefault();
          revokeBtnRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDismiss]);

  if (!isOpen || !device) return null;

  const formattedTime = new Date(device.firstSeen).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-device-modal-title"
      aria-describedby="new-device-modal-desc"
    >
      <motion.div
        ref={modalRef}
        initial={prefersReducedMotion.current ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg rounded-2xl bg-white border border-zinc-200 p-8 shadow-2xl space-y-8 text-zinc-900"
      >
        {/* Header & Close Button */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 font-semibold block">
                Security Alert • Browser Session
              </span>
              <h2
                id="new-device-modal-title"
                className="text-lg font-bold font-heading text-zinc-900 tracking-tight"
              >
                New Browser Session Detected
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Dismiss alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explainer Body */}
        <p id="new-device-modal-desc" className="text-sm text-zinc-600 leading-relaxed">
          Your account was just accessed from a browser session not recognized in your trusted device registry.
        </p>

        {/* Real Device Information Card */}
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-5 space-y-4 text-xs sm:text-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <span className="text-zinc-600 font-medium flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-500" />
              Browser & Platform:
            </span>
            <span className="font-semibold text-zinc-900 font-mono">{device.label}</span>
          </div>

          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <span className="text-zinc-600 font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              Session Login Time:
            </span>
            <span className="font-mono text-zinc-900">{formattedTime}</span>
          </div>

          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <span className="text-zinc-600 font-medium flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              Account Home Region:
            </span>
            <span className="font-mono text-zinc-900">{accountHomeRegion} (Demo)</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-600 font-medium">Session Token:</span>
            <span className="font-mono text-xs text-zinc-500 truncate max-w-[190px]">
              {device.deviceId}
            </span>
          </div>
        </div>

        {/* Demo Limitation Notice */}
        <div className="flex items-start gap-2 p-4 rounded-lg bg-zinc-100 border border-zinc-200 text-xs text-zinc-600 leading-snug">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            This alert recognizes the local browser storage session. Revoking access clears your active demo authentication session.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Action: Revoke Access (Resets demo session to LoginView) */}
          <button
            ref={revokeBtnRef}
            type="button"
            onClick={onRevoke}
            className="w-full py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 active:scale-[0.98] text-red-600 text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
          >
            <LogOut className="w-4 h-4 stroke-[2.2]" />
            <span>This wasn't me — revoke access</span>
          </button>

          {/* Action: That was me (Adds to trusted devices and persists) */}
          <button
            ref={approveBtnRef}
            type="button"
            onClick={onApprove}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold transition-all duration-150 shadow-sm shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>That was me</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
