/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavTab, Transaction, TransactionStatus, NotificationItem } from './types';
import { INITIAL_TRANSACTIONS, NOTIFICATIONS } from './data/mockData';
import { TopBar } from './components/TopBar';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { NewDeviceAlertModal } from './components/confirmation/NewDeviceAlertModal';
import { CardReplacementModal } from './components/confirmation/CardReplacementModal';
import { useAdminConfig } from './hooks/useAdminConfig';
import { useCardControls } from './hooks/useCardControls';
import { useSecurityActivity } from './hooks/useSecurityActivity';
import { useDeviceSession } from './hooks/useDeviceSession';
import { DashboardView } from './components/views/DashboardView';
import { CardSecurityView } from './components/views/CardSecurityView';
import { FraudAlertsView } from './components/views/FraudAlertsView';
import { TransactionsView } from './components/views/TransactionsView';
import { SecurityCenterView } from './components/views/SecurityCenterView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { LoginView } from './components/auth/LoginView';
import { AppleStyleDock } from './components/AppleStyleDock';
import { formatINR } from './utils/currencyFormatter';

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
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Card Replacement Alert Modal State
  const [replacementAlert, setReplacementAlert] = useState<{
    isOpen: boolean;
    fraudTx: Transaction | null;
  }>({
    isOpen: false,
    fraudTx: null,
  });

  // Core Hooks for Cardholder Security & Defense
  const cardControls = useCardControls();
  const securityActivity = useSecurityActivity();
  const deviceSession = useDeviceSession(isAuthenticated);
  const adminConfig = useAdminConfig();

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

  // Count pending step-ups / review items
  const pendingCount = transactions.filter((t) => t.status === 'step-up').length;

  // Handle transaction status change (with strict lock enforcement)
  const handleUpdateStatus = useCallback((txId: string, newStatus: TransactionStatus) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== txId) return tx;
        // IMMUTABILITY GUARD: If already approved or declined, status cannot be changed
        if (tx.status === 'approved' || tx.status === 'declined') {
          return tx;
        }
        return { ...tx, status: newStatus };
      })
    );

    setSelectedTransaction((prev) => {
      if (prev && prev.id === txId) {
        if (prev.status === 'approved' || prev.status === 'declined') return prev;
        return { ...prev, status: newStatus };
      }
      return prev;
    });
  }, []);

  // System-wide Handler: When a transaction is declined or identified as fraudulent by the user/model
  const handleFraudDetected = useCallback((fraudTx: Transaction) => {
    // 1. Immediately ensure status is declined and locked
    handleUpdateStatus(fraudTx.id, 'declined');

    // 2. Temporarily freeze the associated credit card
    cardControls.freezeCard(`Automatic freeze: Fraudulent transaction denied at ${fraudTx.merchant.name}`);

    // 3. Log security activity
    securityActivity.logSecurityEvent({
      type: 'card_freeze',
      title: 'Card Auto-Frozen: Fraudulent Transaction Blocked',
      description: `Model/user declined fraudulent charge of ${formatINR(fraudTx.amount)} at ${fraudTx.merchant.name}. Card immediately frozen to prevent unauthorized charges.`,
      severity: 'critical',
    });

    // 4. Trigger alert to the cardholder with option to initiate a replacement
    setReplacementAlert({
      isOpen: true,
      fraudTx,
    });
  }, [cardControls, securityActivity, handleUpdateStatus]);

  // Handler for executing card replacement
  const handleExecuteReplacement = useCallback(() => {
    const newPan = cardControls.reissueCard();
    securityActivity.logSecurityEvent({
      type: 'alert_resolved',
      title: 'New Replacement Card Issued',
      description: `Compromised card permanently retired. New card (${newPan}) activated with digital security token.`,
      severity: 'success',
    });
    return newPan;
  }, [cardControls, securityActivity]);

  // Simulate an incoming live transaction (automatic evaluation)
  const handleSimulateNewTransaction = () => {
    const templates: Partial<Transaction>[] = [
      {
        merchant: { name: 'Apple Store Online', category: 'Digital Goods & Gaming' },
        cardholder: {
          name: 'Eleanor Vance',
          email: 'eleanor.vance@fraudshield.me',
          maskedCard: cardControls.maskedCard,
          cardBrand: 'Visa',
          country: 'United States',
        },
        amount: 320.15,
        status: 'approved',
        riskScore: 8,
        ipAddress: '54.240.198.1 (Apple Cloud)',
        deviceType: 'macOS 15.3 Safari',
        decisionLatencyMs: 8,
        authMethod: 'Tokenized',
        factors: [
          {
            id: `f_${Date.now()}`,
            name: 'Device & Cardholder Verified',
            impact: 'low',
            description: 'Matching registered hardware token.',
            scoreContribution: 6,
          },
        ],
      },
      {
        merchant: { name: 'Rolex Boutique Zurich', category: 'Luxury Horology' },
        cardholder: {
          name: 'Eleanor Vance',
          email: 'eleanor.vance@fraudshield.me',
          maskedCard: cardControls.maskedCard,
          cardBrand: 'Visa',
          country: 'Switzerland',
        },
        amount: 14200.0,
        status: 'step-up',
        riskScore: 97,
        ipAddress: '185.190.140.2 (Bulletproof Hosting)',
        deviceType: 'Headless Browser Node',
        decisionLatencyMs: 11,
        authMethod: 'Swipe/Chip',
        factors: [
          {
            id: `f_${Date.now()}_1`,
            name: 'Luxury Outlier Spike',
            impact: 'critical',
            description: 'Amount significantly exceeds typical transaction ceiling.',
            scoreContribution: 45,
          },
          {
            id: `f_${Date.now()}_2`,
            name: 'Sanctioned IP Geolocation',
            impact: 'critical',
            description: 'Foreign anonymous proxy mask detected.',
            scoreContribution: 52,
          },
        ],
      },
      {
        merchant: { name: 'FlightAware Global Charter', category: 'Executive Aviation' },
        cardholder: {
          name: 'Eleanor Vance',
          email: 'eleanor.vance@fraudshield.me',
          maskedCard: cardControls.maskedCard,
          cardBrand: 'Visa',
          country: 'United Kingdom',
        },
        amount: 2450.0,
        status: 'step-up',
        riskScore: 64,
        ipAddress: '194.26.29.110 (Mullvad VPN Node)',
        deviceType: 'iPadOS 18 Safari',
        decisionLatencyMs: 14,
        authMethod: 'Tokenized',
        factors: [
          {
            id: `f_${Date.now()}_3`,
            name: 'Commercial VPN Active',
            impact: 'medium',
            description: 'Anonymous proxy mask detected during high-value booking.',
            scoreContribution: 38,
          },
        ],
      },
    ];

    const randomPick = templates[Math.floor(Math.random() * templates.length)];
    const now = new Date();
    const formattedTime = now.toTimeString().split(' ')[0];
    const newId = `tx_${Date.now().toString().slice(-8)}`;

    let dynamicStatus: TransactionStatus = 'approved';
    const computedScore = randomPick.riskScore!;

    // 1. RULE CHECK: Is card frozen?
    if (cardControls.isCardFrozen) {
      dynamicStatus = 'declined';
      securityActivity.logSecurityEvent({
        type: 'fraud_blocked',
        title: `Declined: Card is Frozen (${randomPick.merchant?.name})`,
        description: `Attempted charge of ${formatINR(randomPick.amount || 0)} automatically blocked by card freeze lock.`,
        severity: 'critical',
      });
    }
    // 2. RULE CHECK: Is category blocked?
    else if (cardControls.isCategoryBlocked(randomPick.merchant?.category || '')) {
      dynamicStatus = 'declined';
      securityActivity.logSecurityEvent({
        type: 'fraud_blocked',
        title: `Declined: Category Restricted (${randomPick.merchant?.category})`,
        description: `Transaction at ${randomPick.merchant?.name} blocked by consumer category policy.`,
        severity: 'warning',
      });
    }
    // 3. RULE CHECK: Is Geo-locked and outside home region?
    else if (cardControls.isGeoLocked && randomPick.cardholder?.country !== cardControls.homeRegion) {
      dynamicStatus = 'declined';
      securityActivity.logSecurityEvent({
        type: 'fraud_blocked',
        title: `Declined: Foreign Transaction Blocked`,
        description: `Charge in ${randomPick.cardholder?.country} blocked by Home Region (${cardControls.homeRegion}) security lock.`,
        severity: 'warning',
      });
    }
    // 4. ML / Risk Score Evaluation
    // Suspicious transactions are placed into 'step-up' (Pending Review) state for manual dashboard triage
    else {
      const cutoff = adminConfig.committedConfig.riskScoreCutoff;
      if (computedScore > cutoff) {
        dynamicStatus = 'step-up';
      } else {
        dynamicStatus = 'approved';
      }
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

    // Add alert notification for dashboard awareness
    if (newTx.status === 'step-up' || newTx.status === 'declined') {
      const newNotif: NotificationItem = {
        id: `n_${Date.now()}`,
        title:
          newTx.status === 'step-up'
            ? `Pending Review: Suspicious Activity Flagged`
            : cardControls.isCardFrozen
            ? `Charge Blocked (Card Frozen)`
            : `Suspicious Transaction Blocked`,
        message: `${newTx.merchant.name} (${formatINR(newTx.amount)}) — Score: ${newTx.riskScore}/100`,
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
    <div className="min-h-screen bg-[#000000] text-[#EDEDED] flex flex-col antialiased selection:bg-white/20">
      {/* Main Content Area - Full width with bottom padding for AppleStyleDock */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Top Header Bar */}
        <TopBar
          notifications={notifications}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSignOut={handleSignOut}
          onNavigateHome={() => setCurrentTab('dashboard')}
          onSelectTransaction={(txId) => {
            const found = transactions.find((t) => t.id === txId);
            if (found) setSelectedTransaction(found);
          }}
        />

        {/* View Content with Smooth Transitions and bottom clearance for Dock */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{
                duration: 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {currentTab === 'dashboard' && (
                <DashboardView
                  transactions={transactions}
                  onSelectTransaction={(tx) => setSelectedTransaction(tx)}
                  cardControls={cardControls}
                  securityActivity={securityActivity}
                  onNavigateToTab={(tab) => setCurrentTab(tab as NavTab)}
                  onInitiateReplacement={() => setReplacementAlert({ isOpen: true, fraudTx: null })}
                  searchFilter={searchQuery}
                />
              )}

              {currentTab === 'card-security' && (
                <CardSecurityView
                  cardControls={cardControls}
                  securityActivity={securityActivity}
                  onNavigateToSecurityCenter={() => setCurrentTab('security-center')}
                />
              )}

              {(currentTab === 'fraud-alerts' || currentTab === 'review-queue') && (
                <FraudAlertsView
                  transactions={transactions}
                  onSelectTransaction={(tx) => setSelectedTransaction(tx)}
                  onUpdateStatus={handleUpdateStatus}
                  onFreezeCard={cardControls.freezeCard}
                  onTriggerFraudAlert={handleFraudDetected}
                  onLogSecurityEvent={securityActivity.logSecurityEvent}
                />
              )}

              {currentTab === 'transactions' && (
                <TransactionsView
                  transactions={transactions}
                  onSelectTransaction={(tx) => setSelectedTransaction(tx)}
                  searchFilter={searchQuery}
                />
              )}

              {(currentTab === 'security-center' || currentTab === 'notification-logs') && (
                <SecurityCenterView
                  cardControls={cardControls}
                  deviceSession={deviceSession}
                  securityActivity={securityActivity}
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
        onTriggerFraudAlert={handleFraudDetected}
      />

      {/* New Device Recognized Alert Modal */}
      {deviceSession.isAlertActive && deviceSession.unrecognizedDevice && (
        <NewDeviceAlertModal
          device={deviceSession.unrecognizedDevice}
          accountHomeRegion={deviceSession.accountHomeRegion}
          onApprove={deviceSession.approveCurrentDevice}
          onDeny={() => {
            deviceSession.dismissAlert();
            cardControls.freezeCard('New unrecognized device alert disputed');
            securityActivity.logSecurityEvent({
              type: 'card_freeze',
              title: 'Card Frozen: Unrecognized Device Disputed',
              description: 'Access denied to unrecognized device. Card locked for safety.',
              severity: 'critical',
            });
          }}
          onClose={deviceSession.dismissAlert}
        />
      )}

      {/* Fraud Alert & Cardholder Replacement Modal */}
      <CardReplacementModal
        isOpen={replacementAlert.isOpen}
        fraudTransaction={replacementAlert.fraudTx}
        currentMaskedCard={cardControls.maskedCard}
        onInitiateReplacement={handleExecuteReplacement}
        onClose={() => setReplacementAlert({ isOpen: false, fraudTx: null })}
        onKeepFrozen={() => setReplacementAlert({ isOpen: false, fraudTx: null })}
      />

      {/* Apple-Style Interactive Floating Dock */}
      <AppleStyleDock
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        pendingAlertsCount={pendingCount}
        isCardFrozen={cardControls.isCardFrozen}
      />
    </div>
  );
}
