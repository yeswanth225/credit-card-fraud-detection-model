import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_HOME_REGION } from './useCardControls';

export const DEVICE_ID_KEY = 'fraudshield_device_id';
export const TRUSTED_DEVICES_KEY = 'fraudshield_trusted_devices';

export interface DeviceRecord {
  deviceId: string;
  browserName: string;
  osName: string;
  label: string;
  firstSeen: string;
}

/**
 * Extracts non-invasive browser and platform information
 * using standard, non-fingerprinting Web APIs.
 */
function getBrowserAndOsInfo(): { browserName: string; osName: string; label: string } {
  if (typeof window === 'undefined' || !navigator) {
    return {
      browserName: 'Unknown Browser',
      osName: 'Unknown OS',
      label: 'Unknown Browser Session',
    };
  }

  const ua = navigator.userAgent;
  let browserName = 'Browser';
  if (ua.includes('Edg/')) {
    browserName = 'Microsoft Edge';
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    browserName = 'Google Chrome';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    browserName = 'Apple Safari';
  } else if (ua.includes('Firefox/')) {
    browserName = 'Mozilla Firefox';
  }

  let osName = 'Unknown OS';
  if (ua.includes('Windows NT 10.0') || ua.includes('Windows')) {
    osName = 'Windows';
  } else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) {
    osName = 'macOS';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    osName = 'iOS';
  } else if (ua.includes('Android')) {
    osName = 'Android';
  } else if (ua.includes('Linux')) {
    osName = 'Linux';
  }

  return {
    browserName,
    osName,
    label: `${browserName} on ${osName}`,
  };
}

/**
 * Retrieves or initializes the local installation token representing
 * the current browser/storage instance (not a hardware fingerprint).
 */
function getOrCreateLocalDeviceId(): string {
  if (typeof window === 'undefined') return 'server_session';
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return `session_${Date.now().toString(36)}`;
  }
}

/**
 * Safely reads the trusted devices list from localStorage.
 */
export function readTrustedDevices(): DeviceRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRUSTED_DEVICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) => item && typeof item.deviceId === 'string' && typeof item.label === 'string'
      );
    }
  } catch (err) {
    console.warn('[FraudShield] Malformed trusted devices storage recovered:', err);
  }
  return [];
}

/**
 * Safely persists trusted devices to localStorage.
 */
function writeTrustedDevices(devices: DeviceRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TRUSTED_DEVICES_KEY, JSON.stringify(devices));
  } catch (err) {
    console.warn('[FraudShield] Failed to write trusted devices:', err);
  }
}

/**
 * useDeviceSession
 * Manages device recognition, trusted devices storage, and new-browser-session alerts.
 */
export function useDeviceSession(isAuthenticated: boolean) {
  const [currentDevice, setCurrentDevice] = useState<DeviceRecord>(() => {
    const id = getOrCreateLocalDeviceId();
    const info = getBrowserAndOsInfo();
    return {
      deviceId: id,
      browserName: info.browserName,
      osName: info.osName,
      label: info.label,
      firstSeen: new Date().toISOString(),
    };
  });

  const [trustedDevices, setTrustedDevices] = useState<DeviceRecord[]>(() => readTrustedDevices());
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false);
  const [unrecognizedDevice, setUnrecognizedDevice] = useState<DeviceRecord | null>(null);

  // Initialize or evaluate device trust upon successful authentication
  useEffect(() => {
    if (!isAuthenticated) {
      setIsAlertActive(false);
      setUnrecognizedDevice(null);
      return;
    }

    const currentId = getOrCreateLocalDeviceId();
    const info = getBrowserAndOsInfo();
    const activeDevice: DeviceRecord = {
      deviceId: currentId,
      browserName: info.browserName,
      osName: info.osName,
      label: info.label,
      firstSeen: new Date().toISOString(),
    };
    setCurrentDevice(activeDevice);

    const existingList = readTrustedDevices();

    // 1. FIRST DEVICE: No trusted devices registry exists or is empty
    if (existingList.length === 0) {
      const initialList = [activeDevice];
      writeTrustedDevices(initialList);
      setTrustedDevices(initialList);
      setIsAlertActive(false);
      setUnrecognizedDevice(null);
      return;
    }

    // 2. RETURNING DEVICE: Current deviceId matches existing trusted device
    const isKnown = existingList.some((d) => d.deviceId === currentId);
    if (isKnown) {
      setTrustedDevices(existingList);
      setIsAlertActive(false);
      setUnrecognizedDevice(null);
      return;
    }

    // 3. NEW DEVICE / UNRECOGNIZED BROWSER SESSION
    setTrustedDevices(existingList);
    setUnrecognizedDevice(activeDevice);
    setIsAlertActive(true);
  }, [isAuthenticated]);

  // ACTION: "That was me" - Trust this device and dismiss alert
  const approveCurrentDevice = useCallback(() => {
    if (!unrecognizedDevice) return;

    setTrustedDevices((prev) => {
      const next = [...prev.filter((d) => d.deviceId !== unrecognizedDevice.deviceId), unrecognizedDevice];
      writeTrustedDevices(next);
      return next;
    });

    setIsAlertActive(false);
    setUnrecognizedDevice(null);
  }, [unrecognizedDevice]);

  // DISMISS ALERT (Without adding to trusted devices - e.g. for inspection)
  const dismissAlert = useCallback(() => {
    setIsAlertActive(false);
  }, []);

  return {
    currentDevice,
    trustedDevices,
    isAlertActive,
    unrecognizedDevice,
    approveCurrentDevice,
    dismissAlert,
    accountHomeRegion: DEFAULT_HOME_REGION,
  };
}
