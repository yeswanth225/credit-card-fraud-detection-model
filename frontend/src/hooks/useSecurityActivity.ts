import { useState, useCallback, useEffect } from 'react';
import { SecurityActivityEvent } from '../types';

const ACTIVITY_STORAGE_KEY = 'fraudshield_security_activity';

const INITIAL_ACTIVITY: SecurityActivityEvent[] = [
  {
    id: 'act_1',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    formattedTime: '12 mins ago',
    type: 'alert_resolved',
    title: 'Verification Step-Up Confirmed',
    description: 'Apple Store online purchase of ₹4,200 verified via 2-way challenge.',
    severity: 'success',
  },
  {
    id: 'act_2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    formattedTime: '3 hours ago',
    type: 'fraud_blocked',
    title: 'Automated Fraud Interception',
    description: 'Flagged suspicious high-velocity burst from an unrecognized IP address.',
    severity: 'critical',
  },
  {
    id: 'act_3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    formattedTime: 'Yesterday',
    type: 'geo_locked',
    title: 'Geographic Lock Enforced',
    description: 'Home Region security rule active. Out-of-country transactions restricted.',
    severity: 'info',
  },
  {
    id: 'act_4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    formattedTime: '2 days ago',
    type: 'device_trusted',
    title: 'New Device Authorized',
    description: 'Current browser session added to trusted devices registry.',
    severity: 'info',
  },
];

export function useSecurityActivity() {
  const [activities, setActivities] = useState<SecurityActivityEvent[]>(() => {
    if (typeof window === 'undefined') return INITIAL_ACTIVITY;
    try {
      const saved = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return INITIAL_ACTIVITY;
  });

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities));
    } catch {}
  }, [activities]);

  const logSecurityEvent = useCallback(
    (event: Omit<SecurityActivityEvent, 'id' | 'timestamp' | 'formattedTime'>) => {
      const now = new Date();
      const newEvent: SecurityActivityEvent = {
        ...event,
        id: `act_${Date.now()}`,
        timestamp: now.toISOString(),
        formattedTime: 'Just now',
      };
      setActivities((prev) => [newEvent, ...prev]);
    },
    []
  );

  return {
    activities,
    logSecurityEvent,
  };
}
