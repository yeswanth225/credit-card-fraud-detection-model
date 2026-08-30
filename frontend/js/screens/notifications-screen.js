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
              <div class="notifications-list" id="notif-list">
                ${notifs.map(n => notifItemHTML(n)).join('')}
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

function notifItemHTML(n) {
  const isHigh = n.riskLevel === 'high';
  return `
    <div class="notif-item${n.read ? '' : ' unread'}" data-notif-id="${n.id}" data-tx-id="${n.transactionId}">
      <div class="notif-body">
        <div class="notif-message">
          ${isHigh ? icon('alertTriangle', { size: 13, className: 'text-high' }) : icon('info', { size: 13 })}
          ${esc(n.message)}
        </div>
        <div class="notif-time" style="display:flex;gap:12px;align-items:center;margin-top:6px">
          <span>${formatRelative(n.createdAt)}</span>
          ${n.transactionId ? `
            <a href="#/transaction/${n.transactionId}"
              class="btn btn-ghost btn-sm"
              style="padding:1px 6px;height:auto;font-size:10px"
              onclick="event.stopPropagation()">
              Audit Record ${icon('chevronRight', { size: 9 })}
            </a>` : ''}
        </div>
      </div>
      <span class="badge badge-${n.riskLevel === 'high' ? 'high' : n.riskLevel === 'medium' ? 'medium' : 'neutral'}" style="flex-shrink:0">
        ${n.riskLevel === 'high' ? 'High Risk' : n.riskLevel === 'medium' ? 'Medium Risk' : 'Info'}
      </span>
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

  document.querySelectorAll('.notif-item').forEach(item => {
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
