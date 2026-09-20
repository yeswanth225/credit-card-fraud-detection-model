import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Cpu,
  KeyRound,
} from 'lucide-react';
import { NetworkMeshBackground } from './NetworkMeshBackground';

interface LoginViewProps {
  onLogin: () => void;
  reducedMotion?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, reducedMotion = false }) => {
  const [email, setEmail] = useState('alex.vance@fraudshield.internal');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin();
    }, 350);
  };

  const handleQuickDemoAccess = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin();
    }, 200);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center px-4 py-8 sm:py-12 bg-[#0A0A0B] text-[#EDEDED] overflow-x-hidden selection:bg-[#6366F1]/30 selection:text-white">
      {/* 1. Ambient 3D Network Mesh Background (Exclusive to Login/Landing) */}
      <NetworkMeshBackground reducedMotion={reducedMotion} />

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/30 flex items-center justify-center text-[#818CF8] shadow-xs">
            <Shield className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold tracking-tight text-white">
                FraudShield
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-[#818CF8] bg-[#6366F1]/15 border border-[#6366F1]/30">
                SOC v4.2
              </span>
            </div>
            <p className="text-[11px] text-[#7E7E94] hidden sm:block">
              Credit Card Fraud Prevention & Telemetry
            </p>
          </div>
        </div>

        {/* Live Network Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#131317]/90 backdrop-blur-md border border-[#23232C] text-xs text-[#A4A4B4]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
          </span>
          <span className="font-mono text-[11px] text-[#C2C2D4]">Mesh Active</span>
        </div>
      </header>

      {/* Center: High-Contrast Login Card */}
      <main className="relative z-10 w-full max-w-md my-auto py-6">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl bg-[#131316]/95 backdrop-blur-xl border border-[#262633] p-6 sm:p-8 shadow-2xl space-y-6"
        >
          {/* Card Title & Explainer */}
          <div className="space-y-1.5 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">
              Sign In to Operations Console
            </h1>
            <p className="text-xs text-[#8E8EA2] leading-relaxed">
              Verify transactions, calibrate cost thresholds, and inspect real-time risk telemetry.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-[#C5C5D6]"
              >
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#727288]" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@fraudshield.internal"
                  className="w-full bg-[#0D0D11] border border-[#23232F] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5A5A6E] focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 font-mono transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-[#C5C5D6]"
                >
                  Password
                </label>
                <span className="text-[11px] text-[#7A7A90] hover:text-[#A5B4FC] cursor-pointer transition-colors">
                  Reset credentials?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#727288]" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security key"
                  className="w-full bg-[#0D0D11] border border-[#23232F] rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-[#5A5A6E] focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#727288] hover:text-white transition-colors p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember workstation */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#8E8EA2] select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#2E2E3C] bg-[#0D0D11] text-[#6366F1] focus:ring-[#6366F1]/25 focus:ring-offset-0 transition-colors"
                />
                <span>Remember session on this device</span>
              </label>
              <div className="flex items-center gap-1 text-[11px] font-mono text-[#22C55E]">
                <CheckCircle2 className="w-3 h-3" />
                <span>MFA Verified</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-[#6366F1] hover:bg-[#4F46E5] active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-[#6366F1]/20 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authorizing Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* 1-Click Demo Shortcut */}
              <button
                type="button"
                onClick={handleQuickDemoAccess}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-[#A5B4FC] bg-[#181824] hover:bg-[#202030] border border-[#2B2B3E] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#818CF8]" />
                <span>Quick Demo Access (Lead Analyst)</span>
              </button>
            </div>
          </form>

          {/* Security Telemetry Footer inside Card */}
          <div className="pt-4 border-t border-[#1F1F2A] flex items-center justify-between text-[11px] text-[#7A7A8E]">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Inference Engine: Online</span>
            </div>
            <span className="font-mono text-[#22C55E]">TLS 1.3 Strict</span>
          </div>
        </motion.div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#707085] pt-4 border-t border-[#1C1C24]">
        <div className="flex items-center gap-3">
          <span>SOC 2 Type II Certified</span>
          <span className="w-1 h-1 rounded-full bg-[#353545]" />
          <span>PCI-DSS Level 1 Compliant</span>
          <span className="w-1 h-1 rounded-full bg-[#353545]" />
          <span>ISO 27001</span>
        </div>
        <div>
          <span>© 2026 FraudShield Systems Inc. • All rights reserved</span>
        </div>
      </footer>
    </div>
  );
};
