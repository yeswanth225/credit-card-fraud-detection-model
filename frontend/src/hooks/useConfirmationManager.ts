import { useState, useEffect, useCallback, useRef } from 'react';
import { Transaction, ConfirmationStep, TransactionStatus } from '../types';

interface UseConfirmationManagerProps {
  onResolveTransaction: (txId: string, newStatus: TransactionStatus) => void;
}

export function useConfirmationManager({ onResolveTransaction }: UseConfirmationManagerProps) {
  const [activeTx, setActiveTx] = useState<Transaction | null>(null);
  const [step, setStep] = useState<ConfirmationStep>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [highlightedTxId, setHighlightedTxId] = useState<string | null>(null);
  const [highlightedOutcome, setHighlightedOutcome] = useState<'approved' | 'declined' | null>(null);

  const totalSeconds = 30;
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Trigger a step-up confirmation flow
  const triggerConfirmation = useCallback((tx: Transaction) => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setActiveTx(tx);
    setStep('pending');
    setSecondsRemaining(totalSeconds);
    setIsModalOpen(false); // starts as top toast
  }, []);

  // Handle Approve action
  const handleApprove = useCallback(() => {
    if (!activeTx || step !== 'pending') return;
    setStep('approved');
    setIsModalOpen(true); // show modal with resolution state

    dismissTimerRef.current = setTimeout(() => {
      const txId = activeTx.id;
      onResolveTransaction(txId, 'approved');
      setHighlightedTxId(txId);
      setHighlightedOutcome('approved');

      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedTxId(null), 3200);

      // Close modal and reset
      setIsModalOpen(false);
      setActiveTx(null);
      setStep('idle');
    }, 1500);
  }, [activeTx, step, onResolveTransaction]);

  // Handle Deny action
  const handleDeny = useCallback(() => {
    if (!activeTx || step !== 'pending') return;
    setStep('declined');
    setIsModalOpen(true); // show modal with resolution state

    dismissTimerRef.current = setTimeout(() => {
      const txId = activeTx.id;
      onResolveTransaction(txId, 'declined');
      setHighlightedTxId(txId);
      setHighlightedOutcome('declined');

      setTimeout(() => setHighlightedTxId(null), 3200);

      setIsModalOpen(false);
      setActiveTx(null);
      setStep('idle');
    }, 1500);
  }, [activeTx, step, onResolveTransaction]);

  // Countdown effect while in 'pending' state
  useEffect(() => {
    if (step !== 'pending' || !activeTx) return;

    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Timeout reached! State machine: pending -> timeout -> expired -> declined
          clearInterval(countdownIntervalRef.current!);
          setStep('expired');
          setIsModalOpen(true); // show expired resolution screen

          dismissTimerRef.current = setTimeout(() => {
            const txId = activeTx.id;
            onResolveTransaction(txId, 'declined');
            setHighlightedTxId(txId);
            setHighlightedOutcome('declined');

            setTimeout(() => setHighlightedTxId(null), 3200);

            setIsModalOpen(false);
            setActiveTx(null);
            setStep('idle');
          }, 1500);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [step, activeTx, onResolveTransaction]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    activeTx,
    step,
    secondsRemaining,
    totalSeconds,
    isModalOpen,
    highlightedTxId,
    highlightedOutcome,
    triggerConfirmation,
    handleApprove,
    handleDeny,
    openModal,
    closeModal,
  };
}
