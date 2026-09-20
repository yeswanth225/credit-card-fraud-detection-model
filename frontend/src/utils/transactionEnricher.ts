import { Transaction, CorroborationSignal, ReasoningChip, TimelineEvent, TransactionLocation } from '../types';

/**
 * Extracts or infers a location object from transaction details
 */
export function getTransactionLocation(tx: Transaction): TransactionLocation {
  if (tx.location) return tx.location;

  // Infer from IP address or cardholder country
  const ipText = tx.ipAddress.toLowerCase();
  if (ipText.includes('frankfurt') || ipText.includes('germany')) {
    return { city: 'Frankfurt', country: 'Germany', countryCode: 'DE' };
  } else if (ipText.includes('new york')) {
    return { city: 'New York', country: 'United States', countryCode: 'US' };
  } else if (ipText.includes('miami')) {
    return { city: 'Miami, FL', country: 'United States', countryCode: 'US' };
  } else if (ipText.includes('toronto')) {
    return { city: 'Toronto', country: 'Canada', countryCode: 'CA' };
  } else if (ipText.includes('tor') || ipText.includes('russia') || ipText.includes('bulletproof')) {
    return { city: 'Moscow (Relayed via Tor)', country: 'Russian Federation', countryCode: 'RU' };
  } else if (ipText.includes('digitalocean') || ipText.includes('vpn')) {
    return { city: 'San Francisco, CA (Datacenter)', country: 'United States', countryCode: 'US' };
  } else if (ipText.includes('aws') || ipText.includes('london')) {
    return { city: 'London', country: 'United Kingdom', countryCode: 'GB' };
  }

  // Fallback to cardholder country
  const country = tx.cardholder.country || 'United States';
  const city = country === 'United States' ? 'San Francisco, CA' : country.split(' ')[0];
  return { city, country };
}

/**
 * Calculates a corroboration score (0-100) consistent with risk score and status
 * Corroboration communicates behavioral familiarity, telemetry integrity, and credential consistency
 */
export function getCorroborationScore(tx: Transaction): number {
  if (tx.corroborationScore !== undefined) {
    return tx.corroborationScore;
  }

  // Corroboration is generally the inverse of risk, but modulated by specific factors
  if (tx.status === 'approved') {
    // Approved transactions have very high corroboration (typically 80-98)
    return Math.max(76, Math.min(98, 100 - tx.riskScore + 2));
  } else if (tx.status === 'declined') {
    // Declined transactions have very low corroboration (typically 5-30)
    return Math.max(4, Math.min(28, Math.round((100 - tx.riskScore) * 0.4)));
  } else {
    // Step-up pending has moderate corroboration (typically 38-58)
    return Math.max(35, Math.min(62, Math.round(100 - tx.riskScore * 0.8)));
  }
}

/**
 * Returns the decision matrix outcome badge text
 */
export function getDecisionMatrixOutcome(riskScore: number, corroborationScore: number, status: string): {
  text: string;
  badgeStyle: string;
} {
  if (status === 'declined' || (riskScore >= 70 && corroborationScore <= 35)) {
    return {
      text: 'High Risk + Low Corroboration → Declined',
      badgeStyle: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
    };
  } else if (status === 'approved' || (riskScore <= 35 && corroborationScore >= 65)) {
    return {
      text: 'Low Risk + High Corroboration → Approved',
      badgeStyle: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30',
    };
  } else {
    return {
      text: 'Elevated Risk + Moderate Corroboration → Step-Up Pending',
      badgeStyle: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
    };
  }
}

/**
 * Generates the plain-language reasoning sentence and individual chips
 */
export function getDecisionReasoning(tx: Transaction): {
  summary: string;
  chips: ReasoningChip[];
} {
  if (tx.decisionReasoning && tx.decisionChips) {
    return { summary: tx.decisionReasoning, chips: tx.decisionChips };
  }

  if (tx.status === 'declined') {
    const chips: ReasoningChip[] = [
      {
        id: 'c1',
        label: 'Anonymized IP',
        tooltip: 'Originating connection routed through Tor exit node or bulletproof proxy host.',
        type: 'risk',
      },
      {
        id: 'c2',
        label: 'Unrecognized device',
        tooltip: 'Hardware fingerprint and canvas renderer have never been observed on this account.',
        type: 'risk',
      },
      {
        id: 'c3',
        label: 'Location mismatch',
        tooltip: 'Physical IP origin is inconsistent with recent cardholder spending and billing country.',
        type: 'risk',
      },
      {
        id: 'c4',
        label: 'Velocity spike',
        tooltip: 'Multiple rapid authorization attempts detected across disjoint payment gateways.',
        type: 'risk',
      },
    ];
    return {
      summary: 'Declined: new merchant + unrecognized device + location inconsistent with recent activity',
      chips,
    };
  }

  if (tx.status === 'step-up') {
    const chips: ReasoningChip[] = [
      {
        id: 'c1',
        label: 'New merchant',
        tooltip: 'Cardholder has no historical transaction history with this merchant or merchant category.',
        type: 'warning',
      },
      {
        id: 'c2',
        label: 'Unrecognized device',
        tooltip: 'Device fingerprint lacks persistent authentication cookies or hardware binding.',
        type: 'warning',
      },
      {
        id: 'c3',
        label: 'High ticket amount',
        tooltip: 'Authorization amount exceeds 4.5x cardholder 90-day rolling median.',
        type: 'warning',
      },
      {
        id: 'c4',
        label: 'Datacenter proxy hop',
        tooltip: 'Connection originates from a cloud subnet rather than a registered residential ISP.',
        type: 'warning',
      },
    ];
    return {
      summary: 'Step-Up Challenge: new merchant + unrecognized device + elevated ticket size requiring cardholder out-of-band verification',
      chips,
    };
  }

  // Approved
  const chips: ReasoningChip[] = [
    {
      id: 'c1',
      label: 'Known trusted device',
      tooltip: 'Cryptographically verified device token seen over 180+ sessions with zero chargebacks.',
      type: 'trust',
    },
    {
      id: 'c2',
      label: 'Verified residential IP',
      tooltip: 'Originating IP matches cardholder primary residential carrier and billing municipality.',
      type: 'trust',
    },
    {
      id: 'c3',
      label: 'Normal spending pattern',
      tooltip: 'Amount and merchant category fall well within the cardholder expected variance envelope.',
      type: 'trust',
    },
    {
      id: 'c4',
      label: 'Passkey / Tokenized Auth',
      tooltip: 'Authenticated using FIDO2 biometric passkey with hardware cryptographic proof.',
      type: 'trust',
    },
  ];
  return {
    summary: 'Approved: trusted device + confirmed residential carrier + consistent behavioral cadence',
    chips,
  };
}

/**
 * Returns the corroboration signals feeding into the corroboration score
 */
export function getCorroborationSignals(tx: Transaction, overallCorroboration: number): CorroborationSignal[] {
  if (tx.corroborationSignals && tx.corroborationSignals.length > 0) {
    return tx.corroborationSignals;
  }

  const factor = overallCorroboration / 100;

  if (tx.status === 'approved') {
    return [
      {
        id: 'sig_dev',
        name: 'Device Match',
        score: Math.min(100, Math.round(92 + (overallCorroboration - 85) * 0.4)),
        weight: '30%',
        description: 'Persistent hardware binding & canvas telemetry match trusted profile',
        status: 'strong',
      },
      {
        id: 'sig_loc',
        name: 'Location Continuity',
        score: Math.min(100, Math.round(95 + (overallCorroboration - 85) * 0.3)),
        weight: '25%',
        description: 'Residential ISP carrier hops directly to billing metro area',
        status: 'strong',
      },
      {
        id: 'sig_time',
        name: 'Time-Decay Weight',
        score: Math.min(100, Math.round(88 + (overallCorroboration - 85) * 0.5)),
        weight: '20%',
        description: 'Active diurnal spending window and consistent inter-purchase intervals',
        status: 'strong',
      },
      {
        id: 'sig_sess',
        name: 'Session Behavior',
        score: Math.min(100, Math.round(94 + (overallCorroboration - 85) * 0.3)),
        weight: '25%',
        description: 'Natural human pointer velocity, touch dynamics, and checkout dwell time',
        status: 'strong',
      },
    ];
  } else if (tx.status === 'declined') {
    return [
      {
        id: 'sig_dev',
        name: 'Device Match',
        score: Math.max(2, Math.round(12 * factor + 4)),
        weight: '30%',
        description: 'Headless browser environment; zero previous historical sessions',
        status: 'weak',
      },
      {
        id: 'sig_loc',
        name: 'Location Continuity',
        score: Math.max(1, Math.round(8 * factor + 3)),
        weight: '25%',
        description: 'Anonymized routing; geodistance jump of 4,200km in under 12 minutes',
        status: 'weak',
      },
      {
        id: 'sig_time',
        name: 'Time-Decay Weight',
        score: Math.max(5, Math.round(18 * factor + 8)),
        weight: '20%',
        description: 'Off-hours burst velocity inconsistent with user account diurnal profile',
        status: 'weak',
      },
      {
        id: 'sig_sess',
        name: 'Session Behavior',
        score: Math.max(2, Math.round(6 * factor + 2)),
        weight: '25%',
        description: 'Programmatic form filling detected; 0ms inter-keystroke variance',
        status: 'weak',
      },
    ];
  } else {
    // Step-up pending
    return [
      {
        id: 'sig_dev',
        name: 'Device Match',
        score: Math.round(28 + factor * 20),
        weight: '30%',
        description: 'New Safari user-agent on existing operating system family',
        status: 'moderate',
      },
      {
        id: 'sig_loc',
        name: 'Location Continuity',
        score: Math.round(44 + factor * 15),
        weight: '25%',
        description: 'Transit roaming network with cross-state cellular base station',
        status: 'moderate',
      },
      {
        id: 'sig_time',
        name: 'Time-Decay Weight',
        score: Math.round(68 + factor * 10),
        weight: '20%',
        description: 'Consistent with weekend retail browsing behavior',
        status: 'strong',
      },
      {
        id: 'sig_sess',
        name: 'Session Behavior',
        score: Math.round(38 + factor * 18),
        weight: '25%',
        description: 'Accelerated navigation to payment without cart idle time',
        status: 'moderate',
      },
    ];
  }
}

/**
 * Helper to generate human-readable 12-hour clock timestamps (e.g. 2:41:03 PM)
 */
function formatClockTime(tx: Transaction, offsetSeconds: number): string {
  try {
    let d: Date;
    if (tx.timestamp) {
      d = new Date(tx.timestamp);
      if (isNaN(d.getTime())) {
        d = new Date();
      }
    } else {
      d = new Date();
    }

    // If formattedTime has time info, keep day but set hour/min/sec
    if (tx.formattedTime && tx.formattedTime.includes(':')) {
      const parts = tx.formattedTime.split(':').map((p) => parseInt(p, 10));
      if (!isNaN(parts[0])) d.setHours(parts[0]);
      if (!isNaN(parts[1])) d.setMinutes(parts[1]);
      if (!isNaN(parts[2])) d.setSeconds(parts[2]);
    }

    const targetDate = new Date(d.getTime() + offsetSeconds * 1000);
    return targetDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return '2:41:03 PM';
  }
}

/**
 * Returns chronological timeline events for the transaction lifecycle
 */
export function getTransactionTimeline(tx: Transaction): TimelineEvent[] {
  if (tx.timeline && tx.timeline.length > 0) {
    return tx.timeline;
  }

  const isStepUp = tx.status === 'step-up';
  const isApproved = tx.status === 'approved';
  const isDeclined = tx.status === 'declined';

  const t1 = formatClockTime(tx, 0);
  const t2 = formatClockTime(tx, 0);
  const t3 = formatClockTime(tx, 1);
  const t4 = formatClockTime(tx, 1);
  const t5 = formatClockTime(tx, 2);
  const t6 = formatClockTime(tx, 3);

  const events: TimelineEvent[] = [
    {
      id: 'tl_1',
      step: 'Initiated',
      subLabel: `Transaction attempted at ${tx.merchant.name}`,
      status: 'completed',
      timestamp: t1,
      detail: 'Authorization request received via payment network switch pipeline',
      latencyMs: 2,
    },
    {
      id: 'tl_2',
      step: 'Pre-filter checked',
      subLabel: 'Checked for rapid test-transaction patterns',
      status: 'completed',
      timestamp: t2,
      detail: 'Velocity burst limits verified, Luhn check passed, global sanctions queried',
      latencyMs: 3,
    },
    {
      id: 'tl_3',
      step: 'Risk scored',
      subLabel: 'Analyzed against normal spending behavior',
      status: 'completed',
      timestamp: t3,
      detail: 'ML inference engine evaluated account history, device fingerprint, and geo-velocity',
      latencyMs: 6,
    },
    {
      id: 'tl_4',
      step: 'Decision made',
      subLabel: 'Risk and evidence combined into a decision',
      status: 'completed',
      timestamp: t4,
      detail: isStepUp
        ? 'Decision Engine triggered: 2-way verification challenge required'
        : isDeclined
        ? 'Decision Engine triggered: Immediate decline on high threat risk'
        : 'Decision Engine triggered: Frictionless approval granted',
      latencyMs: 3,
    },
  ];

  // Node 5: Step-Up Sent (shown for all; if not needed, shown in skipped/muted state)
  if (isStepUp) {
    events.push({
      id: 'tl_5',
      step: 'Step-up sent',
      subLabel: 'Sent a confirmation request to the cardholder',
      status: 'completed',
      timestamp: t5,
      detail: '2-way interactive prompt dispatched to cardholder primary device',
      latencyMs: 4,
    });
    events.push({
      id: 'tl_6',
      step: 'Resolved',
      subLabel: 'Final outcome: Pending Verification',
      status: 'in-progress',
      timestamp: 'Awaiting Cardholder',
      detail: 'Customer has active 5-minute countdown window to authorize charge',
    });
  } else {
    // Show step-up node as skipped for context
    events.push({
      id: 'tl_5',
      step: 'Step-up sent',
      subLabel: isApproved ? 'Not needed — low risk' : 'Not needed — high fraud block',
      status: 'skipped',
      timestamp: 'Skipped',
      detail: isApproved
        ? 'Corroboration signals strong; verification challenge bypassed to prevent friction'
        : 'Threat score critically high; transaction intercepted immediately without challenge',
    });
    events.push({
      id: 'tl_6',
      step: 'Resolved',
      subLabel: isApproved ? 'Final outcome: Approved' : 'Final outcome: Declined',
      status: isApproved ? 'completed' : 'failed',
      timestamp: t6,
      detail: isApproved
        ? 'Transaction settled and cleared with issuing bank network'
        : 'Charge blocked at edge gateway; advisory sent to merchant terminal',
      latencyMs: 2,
    });
  }

  return events;
}
