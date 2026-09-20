/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavTab, Transaction, TransactionStatus, NotificationItem } from './types';
import { INITIAL_TRANSACTIONS, NOTIFICATIONS } from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { ConfirmationToast } from './components/confirmation/ConfirmationToast';
import { ConfirmationModal } from './components/confirmation/ConfirmationModal';
import { useConfirmationManager } from './hooks/useConfirmationManager';
import { useAdminConfig } from './hooks/useAdminConfig';
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { ReviewQueueView } from './components/views/ReviewQueueView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { NotificationLogsView } from './components/views/NotificationLogsView';
import { LoginView } from './components/auth/LoginView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('fraudshield_authenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATIONS);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleLogin = () => {
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem('fraudshield_authenticated', 'true');
    } catch {}
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('fraudshield_authenticated');
    } catch {}
  };

  // Global Admin Configuration state
  const adminConfig = useAdminConfig();

  // Count pending step-ups
  const pendingCount = transactions.filter((t) => t.status === 'step-up').length;

  // Handle transaction status change (e.g., analyst override: Approve, Challenge, or Decline)
  const handleUpdateStatus = (txId: string, newStatus: TransactionStatus) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === txId ? { ...tx, status: newStatus } : tx))
    );

    // If active modal is open for this transaction, update its state too
    if (selectedTransaction && selectedTransaction.id === txId) {
      setSelectedTransaction((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Two-way SMS / Push Confirmation Flow Manager
  const {
    activeTx: confirmationTx,
    step: confirmationStep,
    secondsRemaining,
    totalSeconds,
    isModalOpen: isConfirmModalOpen,
    highlightedTxId,
    highlightedOutcome,
    triggerConfirmation,
    handleApprove,
    handleDeny,
    openModal: openConfirmModal,
    closeModal: closeConfirmModal,
  } = useConfirmationManager({
    onResolveTransaction: handleUpdateStatus,
  });

  // Prompt the first step-up transaction after ~1.5s to showcase Phase 3 smoothly
  useEffect(() => {
    if (!isAuthenticated) return;
    const firstStepUp = INITIAL_TRANSACTIONS.find((t) => t.status === 'step-up');
    const timer = setTimeout(() => {
      if (firstStepUp) {
        triggerConfirmation(firstStepUp);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [triggerConfirmation, isAuthenticated]);

  // Quick manual trigger for demo/testing
  const handleTriggerPushChallenge = () => {
    const pendingTx = transactions.find((t) => t.status === 'step-up') || transactions[0];
    if (pendingTx) {
      triggerConfirmation(pendingTx);
    }
  };

  // Simulate an incoming live transaction
  const handleSimulateNewTransaction = () => {
    const templates: Partial<Transaction>[] = [
      {
        merchant: { name: 'Amazon Web Services', category: 'Cloud Infrastructure' },
        cardholder: {
          name: 'Sarah Connor',
          email: 'sconnor@resistance.net',
          maskedCard: '•••• 1984',
          cardBrand: 'Visa',
          country: 'United States',
        },
        amount: 320.15,
        status: 'approved',
        riskScore: 6,
        ipAddress: '54.240.198.1 (AWS East)',
        deviceType: 'Ubuntu 24.04 cURL API Token',
        decisionLatencyMs: 8,
        authMethod: 'Tokenized',
        factors: [
          {
            id: `f_${Date.now()}`,
            name: 'Corporate Key Verified',
            impact: 'low',
            description: 'Matching enterprise IAM token.',
            scoreContribution: 6,
          },
        ],
      },
      {
        merchant: { name: 'Rolex Boutique Zurich', category: 'Luxury Horology' },
        cardholder: {
          name: 'Vladimir Petrov',
          email: 'vlad_test77@yandex.ru',
          maskedCard: '•••• 9920',
          cardBrand: 'Mastercard',
          country: 'Russia',
        },
        amount: 14200.0,
        status: 'declined',
        riskScore: 97,
        ipAddress: '185.190.140.2 (Known Bulletproof Host)',
        deviceType: 'Headless Puppeteer Browser',
        decisionLatencyMs: 11,
        authMethod: 'Swipe/Chip',
        factors: [
          {
            id: `f_${Date.now()}_1`,
            name: 'High Dollar Luxury Spike',
            impact: 'critical',
            description: 'Amount exceeds 99.8th percentile for BIN.',
            scoreContribution: 45,
          },
          {
            id: `f_${Date.now()}_2`,
            name: 'Sanctioned IP Geolocation',
            impact: 'critical',
            description: 'Bulletproof hosting provider detected.',
            scoreContribution: 52,
          },
        ],
      },
      {
        merchant: { name: 'FlightAware Global Charter', category: 'Executive Aviation' },
        cardholder: {
          name: 'Daniel Craig',
          email: 'daniel.c@mi6-ops.co.uk',
          maskedCard: '•••• 0070',
          cardBrand: 'Amex',
          country: 'United Kingdom',
        },
        amount: 2450.0,
        status: 'step-up',
        riskScore: 64,
        ipAddress: '194.26.29.110 (Mullvad VPN Node)',
        deviceType: 'iPadOS 18 Safari',
        decisionLatencyMs: 14,
        authMethod: '3DS 2.0',
        factors: [
          {
            id: `f_${Date.now()}_3`,
            name: 'Commercial VPN Active',
            impact: 'medium',
            description: 'Anonymous proxy mask detected during high-value booking.',
            scoreContribution: 38,
          },
          {
            id: `f_${Date.now()}_4`,
            name: 'Velocity Jump',
            impact: 'medium',
            description: 'First booking on account in 6 months.',
            scoreContribution: 26,
          },
        ],
      },
    ];

    const randomPick = templates[Math.floor(Math.random() * templates.length)];
    const now = new Date();
    const formattedTime = now.toTimeString().split(' ')[0];
    const newId = `tx_${Date.now().toString().slice(-8)}`;

    // Dynamic status evaluation governed by live admin thresholds
    const cutoff = adminConfig.committedConfig.riskScoreCutoff;
    const computedScore = randomPick.riskScore!;
    let dynamicStatus: TransactionStatus = 'approved';
    if (computedScore > cutoff + 25) {
      dynamicStatus = 'declined';
    } else if (computedScore > cutoff) {
      dynamicStatus = 'step-up';
    }

    const newTx: Transaction = {
      id: newId,
      timestamp: now.toISOString(),
      formattedTime,
      merchant: randomPick.merchant!,
      cardholder: randomPick.cardholder!,
      amount: randomPick.amount!,
      currency: 'USD',
      status: dynamicStatus,
      riskScore: computedScore,
      ipAddress: randomPick.ipAddress!,
      deviceType: randomPick.deviceType!,
      decisionLatencyMs: randomPick.decisionLatencyMs!,
      factors: randomPick.factors!,
      authMethod: randomPick.authMethod!,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // If step-up, launch the 2-way confirmation flow!
    if (newTx.status === 'step-up') {
      triggerConfirmation(newTx);
    }

    // If step-up or declined, push a notification
    if (newTx.status === 'step-up' || newTx.status === 'declined') {
      const newNotif: NotificationItem = {
        id: `n_${Date.now()}`,
        title:
          newTx.status === 'step-up'
            ? `Step-up challenge triggered`
            : `Fraud attack auto-declined`,
        message: `${newTx.merchant.name} ($${newTx.amount.toFixed(2)}) — Score: ${newTx.riskScore}/100`,
        timeAgo: 'Just now',
        type: newTx.status === 'step-up' ? 'warning' : 'alert',
        unread: true,
        transactionId: newTx.id,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#EDEDED] flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        pendingCount={pendingCount}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area (Offset for sidebar on desktop) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Top Header Bar */}
        <TopBar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          notifications={notifications}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSignOut={handleSignOut}
          onSelectTransaction={(txId) => {
            const found = transactions.find((t) => t.id === txId);
            if (found) setSelectedTransaction(found);
          }}
        />

        {/* View Content with Smooth Cross-Fade Section Transition */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {currentTab === 'dashboard' && (
                <DashboardView
                  transactions={transactions}
                  onSelectTransaction={(tx) => setSelectedTransaction(tx)}
                  searchFilter={searchQuery}
                  highlightedTxId={highlightedTxId}
                  highlightedOutcome={highlightedOutcome}
                />
              )}

              {currentTab === 'transactions' && (
                <TransactionsView
                  transactions={transactions}
                  onSelectTransaction={(tx) => setSelectedTransaction(tx)}
                  searchFilter={searchQuery}
                  highlightedTxId={highlightedTxId}
                  highlightedOutcome={highlightedOutcome}
                />
              )}

              {currentTab === 'review-queue' && (
                <ReviewQueueView
                  transactions={transactions}
                  onSelectTransaction={(tx) => setSelectedTransaction(tx)}
                  onUpdateStatus={handleUpdateStatus}
                  onTriggerStepUpFlow={triggerConfirmation}
                />
              )}

              {currentTab === 'notification-logs' && (
                <NotificationLogsView
                  transactions={transactions}
                  onSelectTransaction={(tx) => setSelectedTransaction(tx)}
                />
              )}

              {currentTab === 'analytics' && <AnalyticsView />}

              {currentTab === 'settings' && <SettingsView adminConfigHook={adminConfig} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Transaction Detail Slide-Over Inspector */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onUpdateStatus={handleUpdateStatus}
        onTriggerStepUpFlow={triggerConfirmation}
      />

      {/* Component 1: Incoming Confirmation Notification (Toast Banner) */}
      <AnimatePresence>
        {confirmationTx && confirmationStep === 'pending' && !isConfirmModalOpen && (
          <ConfirmationToast
            key={confirmationTx.id}
            transaction={confirmationTx}
            secondsRemaining={secondsRemaining}
            totalSeconds={totalSeconds}
            onExpand={openConfirmModal}
            onApprove={handleApprove}
            onDeny={handleDeny}
          />
        )}
      </AnimatePresence>

      {/* Component 2 & 3: Confirmation Modal & Resolution States */}
      <AnimatePresence>
        {confirmationTx && isConfirmModalOpen && (
          <ConfirmationModal
            key={`confirm-modal-${confirmationTx.id}`}
            isOpen={isConfirmModalOpen}
            transaction={confirmationTx}
            step={confirmationStep}
            secondsRemaining={secondsRemaining}
            totalSeconds={totalSeconds}
            onApprove={handleApprove}
            onDeny={handleDeny}
            onClose={closeConfirmModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
