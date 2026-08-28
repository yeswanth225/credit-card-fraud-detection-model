/**
 * notifications.js — In-app alert generation and bell badge management for [cred]
 */

import { Notifications } from './store.js';
import { getRiskLevel } from './ml.js';

/**
 * Generate in-app notifications for transactions in a batch that exceed
 * the user's alert thresholds.
 */
export function generateForBatch(userId, batchId, transactions, notifPrefs = {}) {
  const prefs = { highRisk: true, mediumRisk: false, ...notifPrefs };
  const created = [];

  for (const tx of transactions) {
    const score = tx.classical?.score ?? 0;
    const level = getRiskLevel(score);
    const pct   = Math.round(score * 100);

    const should = (level === 'high' && prefs.highRisk) ||
                   (level === 'medium' && prefs.mediumRisk);
    if (!should) continue;

    const merchant = tx.merchant || 'Unknown merchant';
    const amount   = tx.amount != null ? ` — ₹${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '';
    const prefix   = level === 'high' ? 'High Risk' : 'Medium Risk';

    const notif = Notifications.create(userId, {
      transactionId: tx.id,
      batchId,
      riskLevel: level,
      message: `${prefix}: ${merchant}${amount} scored ${pct}% fraud probability.`,
    });
    created.push(notif);
  }

  updateBell(userId);
  return created;
}

/** Update the notification bell badge in the header & sidebar nav. */
export function updateBell(userId) {
  const count = Notifications.unreadCount(userId);
  window._cred_bellCount = count;

  const badge = document.getElementById('notif-bell-count');
  if (badge) {
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  const btn = document.getElementById('notif-bell-btn');
  if (btn) btn.setAttribute('aria-label', `Notifications${count > 0 ? ` (${count} unread)` : ''}`);

  const navItem = document.querySelector('a[href="#/notifications"]');
  if (navItem) {
    let navBadge = navItem.querySelector('.nav-badge');
    if (count > 0) {
      if (!navBadge) {
        navBadge = document.createElement('span');
        navBadge.className = 'nav-badge';
        navItem.appendChild(navBadge);
      }
      navBadge.textContent = count > 99 ? '99+' : String(count);
      navBadge.style.display = 'inline-block';
    } else if (navBadge) {
      navBadge.style.display = 'none';
    }
  }
}
