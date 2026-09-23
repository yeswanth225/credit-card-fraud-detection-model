import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'fraudshield_card_controls';

export const DEFAULT_HOME_REGION = 'United States';
export const DEFAULT_HOME_COUNTRY_CODE = 'US';
export const ACTIVE_DEMO_CARDHOLDER_NAME = 'Eleanor Vance';
export const ACTIVE_DEMO_CARDHOLDER_MASKED = '•••• 4821';

export interface CardControlsState {
  isCardFrozen: boolean;
  frozenAt: string | null;
  freezeReason: string | null;
  maskedCard: string;
  isGeoLocked: boolean; // Enforce transactions to home region
  homeRegion: string;
  blockedCategories: string[]; // Merchant categories blocked by consumer rule (all allowed by default)
}

const DEFAULT_STATE: CardControlsState = {
  isCardFrozen: false,
  frozenAt: null,
  freezeReason: null,
  maskedCard: '•••• 4821',
  isGeoLocked: false,
  homeRegion: DEFAULT_HOME_REGION,
  blockedCategories: [], // All categories allowed by default; user chooses to restrict
};

/**
 * useCardControls
 * Sibling hook following the useAdminConfig pattern for managing cardholder
 * security lock (card freeze/unfreeze) with synchronized localStorage persistence.
 */
export function useCardControls() {
  const [controls, setControls] = useState<CardControlsState>(() => {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback on restricted localStorage
    }
    return DEFAULT_STATE;
  });

  // Persist whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(controls));
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [controls]);

  const toggleFreeze = useCallback((reason?: string) => {
    setControls((prev) => {
      const nextFrozen = !prev.isCardFrozen;
      return {
        ...prev,
        isCardFrozen: nextFrozen,
        frozenAt: nextFrozen ? new Date().toISOString() : null,
        freezeReason: nextFrozen ? (reason || 'Manual freeze by cardholder') : null,
      };
    });
  }, []);

  const freezeCard = useCallback((reason?: string) => {
    setControls((prev) => ({
      ...prev,
      isCardFrozen: true,
      frozenAt: new Date().toISOString(),
      freezeReason: reason || 'Manual freeze by cardholder',
    }));
  }, []);

  const unfreezeCard = useCallback(() => {
    setControls((prev) => ({
      ...prev,
      isCardFrozen: false,
      frozenAt: null,
      freezeReason: null,
    }));
  }, []);

  const toggleGeoLock = useCallback(() => {
    setControls((prev) => ({
      ...prev,
      isGeoLocked: !prev.isGeoLocked,
    }));
  }, []);

  const toggleCategoryBlock = useCallback((category: string) => {
    setControls((prev) => {
      const isBlocked = prev.blockedCategories.includes(category);
      return {
        ...prev,
        blockedCategories: isBlocked
          ? prev.blockedCategories.filter((c) => c !== category)
          : [...prev.blockedCategories, category],
      };
    });
  }, []);

  const isCategoryBlocked = useCallback(
    (category: string) => {
      return controls.blockedCategories.some(
        (c) => c.toLowerCase() === category.toLowerCase()
      );
    },
    [controls.blockedCategories]
  );

  const reissueCard = useCallback((newMasked?: string) => {
    const nextPan = newMasked || `•••• ${Math.floor(1000 + Math.random() * 9000)}`;
    setControls((prev) => ({
      ...prev,
      maskedCard: nextPan,
      isCardFrozen: false,
      frozenAt: null,
      freezeReason: null,
    }));
    return nextPan;
  }, []);

  return {
    isCardFrozen: controls.isCardFrozen,
    frozenAt: controls.frozenAt,
    freezeReason: controls.freezeReason,
    maskedCard: controls.maskedCard,
    isGeoLocked: controls.isGeoLocked,
    homeRegion: controls.homeRegion,
    blockedCategories: controls.blockedCategories,
    toggleFreeze,
    freezeCard,
    unfreezeCard,
    reissueCard,
    toggleGeoLock,
    toggleCategoryBlock,
    isCategoryBlocked,
  };
}

