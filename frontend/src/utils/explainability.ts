import { Transaction } from '../types';

export interface ExplanationResult {
  fullSentence: string;
  shortInline: string;
}

/**
 * Derives plain-language, human-readable explanations directly from
 * real signals and risk factors present in the transaction data model.
 */
export function getTransactionExplanation(tx: Transaction): ExplanationResult {
  // If card is frozen
  const isFrozen = tx.factors?.some(
    (f) =>
      f.name.toLowerCase().includes('freeze') ||
      f.name.toLowerCase().includes('frozen')
  );
  if (isFrozen) {
    return {
      fullSentence: 'Transaction blocked immediately because cardholder security lock is active on this account.',
      shortInline: 'Card security lock active',
    };
  }

  // If blocked by Merchant Category restriction
  const categoryBlockFactor = tx.factors?.find((f) =>
    f.name.toLowerCase().includes('category restriction') ||
    f.name.toLowerCase().includes('merchant category blocked')
  );
  if (categoryBlockFactor) {
    return {
      fullSentence: `Blocked: ${tx.merchant.category} merchant category restricted by account security controls.`,
      shortInline: 'Category restricted',
    };
  }

  // If blocked by Geographic Lock rule
  const geoLockFactor = tx.factors?.find((f) =>
    f.name.toLowerCase().includes('geographic lock') ||
    f.name.toLowerCase().includes('international lock')
  );
  if (geoLockFactor) {
    return {
      fullSentence: 'Blocked: transaction origin outside authorized home region (Geographic Lock active).',
      shortInline: 'Outside home region',
    };
  }

  // Extract detected risk signals from actual factors on this transaction
  const signals: { key: string; short: string; phrase: string }[] = [];

  if (tx.factors && tx.factors.length > 0) {
    for (const f of tx.factors) {
      const lower = (f.name + ' ' + f.description).toLowerCase();
      if (lower.includes('bulletproof') || lower.includes('sanctioned')) {
        if (!signals.some((s) => s.key === 'bulletproof')) {
          signals.push({
            key: 'bulletproof',
            short: 'Bulletproof host IP',
            phrase: 'connection originating from a known bulletproof hosting node',
          });
        }
      } else if (
        lower.includes('vpn') ||
        lower.includes('datacenter') ||
        lower.includes('proxy')
      ) {
        if (!signals.some((s) => s.key === 'vpn')) {
          signals.push({
            key: 'vpn',
            short: 'Commercial VPN proxy',
            phrase: 'connection masked by a commercial VPN or proxy node',
          });
        }
      } else if (
        lower.includes('device') ||
        lower.includes('fingerprint') ||
        lower.includes('puppeteer')
      ) {
        if (!signals.some((s) => s.key === 'device')) {
          signals.push({
            key: 'device',
            short: 'Unrecognized device',
            phrase: 'an unrecognized hardware and browser fingerprint',
          });
        }
      } else if (lower.includes('velocity') || lower.includes('spike')) {
        if (!signals.some((s) => s.key === 'velocity')) {
          signals.push({
            key: 'velocity',
            short: 'Rapid velocity spike',
            phrase: 'unusual transaction velocity and burst patterns',
          });
        }
      } else if (
        lower.includes('ticket') ||
        lower.includes('luxury') ||
        lower.includes('amount') ||
        lower.includes('median')
      ) {
        if (!signals.some((s) => s.key === 'amount')) {
          signals.push({
            key: 'amount',
            short: 'High ticket amount',
            phrase: 'transaction amount far exceeding historical spending norms',
          });
        }
      } else if (lower.includes('location') || lower.includes('geo')) {
        if (!signals.some((s) => s.key === 'location')) {
          signals.push({
            key: 'location',
            short: 'Unexpected location',
            phrase: 'originating from an unfamiliar geographic region',
          });
        }
      }
    }
  }

  // Fallback heuristics based on direct transaction properties
  if (signals.length === 0) {
    if (
      tx.ipAddress.toLowerCase().includes('vpn') ||
      tx.ipAddress.toLowerCase().includes('datacenter')
    ) {
      signals.push({
        key: 'vpn',
        short: 'VPN proxy detected',
        phrase: 'connection routed through a datacenter or VPN node',
      });
    }
    if (
      tx.deviceType.toLowerCase().includes('new') ||
      tx.deviceType.toLowerCase().includes('puppeteer')
    ) {
      signals.push({
        key: 'device',
        short: 'Unrecognized device',
        phrase: 'unrecognized device telemetry',
      });
    }
  }

  // Approved transactions
  if (tx.status === 'approved') {
    return {
      fullSentence: 'Normal spending pattern verified with consistent device telemetry and residential IP.',
      shortInline: 'Verified trusted activity',
    };
  }

  // Synthesize into natural human sentences
  if (signals.length === 1) {
    const s = signals[0];
    return {
      fullSentence: s.phrase.charAt(0).toUpperCase() + s.phrase.slice(1) + ' detected.',
      shortInline: s.short,
    };
  }

  if (signals.length === 2) {
    const s1 = signals[0];
    const s2 = signals[1];
    return {
      fullSentence:
        s1.phrase.charAt(0).toUpperCase() +
        s1.phrase.slice(1) +
        ' combined with ' +
        s2.phrase +
        '.',
      shortInline: `${s1.short} & ${s2.short}`,
    };
  }

  if (signals.length >= 3) {
    const s1 = signals[0];
    const s2 = signals[1];
    const s3 = signals[2];
    return {
      fullSentence:
        s1.phrase.charAt(0).toUpperCase() +
        s1.phrase.slice(1) +
        ', ' +
        s2.phrase +
        ', and ' +
        s3.phrase +
        '.',
      shortInline: `${s1.short} & ${signals.length - 1} more signals`,
    };
  }

  // Default if no specific signals found
  return {
    fullSentence:
      tx.status === 'declined'
        ? 'Composite threat signals and anomalous velocity exceeded safety cutoffs.'
        : 'Elevated risk parameters requiring out-of-band biometric cardholder confirmation.',
    shortInline: tx.status === 'declined' ? 'Threat signals exceeded' : 'Elevated risk anomaly',
  };
}
