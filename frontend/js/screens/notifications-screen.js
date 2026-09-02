/**
 * notifications-screen.js — Fraud Alerts & Incident Investigation Queue for cred ai
 */

import { Notifications } from '../store.js';
import { icon } from '../icons.js';
import { sidebarHTML, headerHTML, mountSidebarToggle, mountLogout } from '../app.js';
import { updateBell } from '../notifications.js';

const APP = () => document.getElementById('app');

export function renderNotifications(ctx) {
  const { user } = ctx;
  const notifs = Notifications.list(user.id);
  const unread = notifs.filter(n => !n.read).length;

  APP().innerHTML = `
    <div class="app-shell">
      ${sidebarHTML(user, 'notifications')}
      <div class="main-content">
        ${headerHTML('Security Alerts Queue', null, user)}
        <main class="page-body animate-fade-in">
          <div class="section">
            <div class="section-header">
              <div>
                <h2 class="section-title">Automated Fraud Alerts</h2>
                <p class="section-subtitle">${notifs.length} incident${notifs.length !== 1 ? 's' : ''} recorded · ${unread} pending review</p>
              </div>
              <div class="section-actions">
                ${unread > 0 ? `<button class="btn btn-secondary btn-sm" id="mark-all-read">${icon('check', { size: 12 })} Mark All Read</button>` : ''}
              </div>
            </div>

            ${notifs.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state-icon">${icon('bell', { size: 32 })}</div>
                <div class="empty-state-title">No pending security alerts</div>
                <div class="empty-state-desc">Transactions exceeding risk thresholds will automatically trigger incident tickets here.</div>
              </div>
            ` : `
              <div class="alert-list" id="notif-list">
                ${notifs.map(n => alertItemHTML(n)).join('')}
              </div>
            `}
          </div>
        </main>
      </div>
    </div>`;

  mountSidebarToggle();
  mountLogout(ctx);
  mountNotifActions(notifs, ctx);
}

function alertItemHTML(n) {
  const isHigh   = n.riskLevel === 'high';
  const isMedium = n.riskLevel === 'medium';
  const isLow    = n.riskLevel === 'low';

  const sevClass  = isHigh ? 'sev-high' : isMedium ? 'sev-medium' : isLow ? 'sev-low' : 'sev-info';
  const cardClass = isHigh ? 'alert-high' : isMedium ? 'alert-medium' : isLow ? 'alert-low' : 'alert-info';

  const iconName  = isHigh ? 'alertTriangle' : isMedium ? 'alertTriangle' : 'info';
  const iconSize  = 16;

  // Extract a clean title from the message prefix
  const titleMap = { high: 'High Risk Alert', medium: 'Medium Risk Alert', low: 'Low Risk', info: 'Alert' };
  const title = titleMap[n.riskLevel] || 'Alert';

  // Strip the prefix from message for the description line
  const prefixPattern = /^(High Risk Alert|Medium Risk Alert|High Risk|Medium Risk|Low Risk):\s*/i;
  const description = esc(n.message.replace(prefixPattern, ''));

  // Extract amount from message if present (e.g. ₹1,23,456.00)
  const amountMatch = n.message.match(/₹[\d,]+\.?\d*/);
  const amountDisplay = amountMatch ? amountMatch[0] : null;

  // Severity badge label
  const badgeClass = isHigh ? 'badge-high' : isMedium ? 'badge-medium' : 'badge-low';
  const badgeLabel = isHigh ? 'HIGH RISK' : isMedium ? 'MEDIUM RISK' : 'LOW RISK';

  return `
    <div class="alert-item ${cardClass}${n.read ? '' : ' unread'}" data-notif-id="${n.id}" data-tx-id="${n.transactionId || ''}">
      ${!n.read ? '<span class="alert-unread-dot" title="Unread"></span>' : ''}

      <div class="alert-severity-icon ${sevClass}">
        ${icon(iconName, { size: iconSize })}
      </div>

      <div class="alert-body">
        <div class="alert-title-row">
          <span class="alert-title">${title}</span>
          <span class="badge ${badgeClass}" style="font-size:10px;padding:1px 6px">${badgeLabel}</span>
        </div>
        <div class="alert-message" title="${esc(n.message)}">${description}</div>
        <div class="alert-meta">
          <span class="alert-time">
            ${icon('clock', { size: 11 })}
            ${formatRelative(n.createdAt)}
          </span>
          ${amountDisplay ? `<span class="alert-amount">${esc(amountDisplay)}</span>` : ''}
        </div>
      </div>

      <div class="alert-actions">
        ${n.transactionId ? `
          <a href="#/transaction/${n.transactionId}"
            class="btn btn-secondary btn-sm"
            style="font-size:11px;display:flex;align-items:center;gap:4px"
            onclick="event.stopPropagation()">
            Audit Record ${icon('chevronRight', { size: 10 })}
          </a>` : ''}
        ${!n.read ? `<span style="font-size:10px;color:var(--c-text-3);font-family:var(--font-mono)">Click to mark read</span>` : `<span style="font-size:10px;color:var(--c-text-3)">Reviewed</span>`}
      </div>
    </div>`;
}

function mountNotifActions(notifs, ctx) {
  const { user } = ctx;

  document.getElementById('mark-all-read')?.addEventListener('click', () => {
    Notifications.markAllRead(user.id);
    updateBell(user.id);
    window.showToast('All alerts marked as reviewed.', 'success');
    renderNotifications(ctx);
  });

  document.querySelectorAll('.alert-item').forEach(item => {
    item.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      const notifId = item.dataset.notifId;
      const txId    = item.dataset.txId;
      Notifications.markRead(user.id, notifId);
      updateBell(user.id);
      if (txId) ctx.navigate(`/transaction/${txId}`);
    });
  });
}

function formatRelative(isoStr) {
  if (!isoStr) return 'Just now';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

