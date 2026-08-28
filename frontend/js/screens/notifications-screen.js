/**
 * notifications-screen.js — Notifications / Alerts panel screen for [cred]
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
        ${headerHTML('Security Alerts', null, user)}
        <main class="page-body animate-fade-in">
          <div class="section">
            <div class="section-header">
              <div>
                <h2 class="section-title">Automated Fraud Alerts</h2>
                <p class="section-subtitle">${notifs.length} alert${notifs.length!==1?'s':''} · ${unread} unread</p>
              </div>
              <div class="section-actions">
                ${unread > 0 ? `<button class="btn btn-secondary btn-sm" id="mark-all-read">${icon('check', { size: 14 })} Mark all read</button>` : ''}
              </div>
            </div>

            ${notifs.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state-icon">${icon('bell', { size: 36 })}</div>
                <div class="empty-state-title">No pending security alerts</div>
                <div class="empty-state-desc">Transactions exceeding your risk thresholds will automatically appear here. Configure alert sensitivity in <a href="#/settings" style="color:var(--c-text-1);text-decoration:underline">Settings</a>.</div>
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
      <span class="notif-dot" aria-hidden="true"></span>
      <div class="notif-body">
        <div class="notif-message">
          ${isHigh ? icon('alertTriangle', { size: 14, className: 'text-high' }) : icon('info', { size: 14 })}
          ${esc(n.message)}
        </div>
        <div class="notif-time" style="display:flex;gap:12px;align-items:center;margin-top:6px">
          <span>${formatRelative(n.createdAt)}</span>
          ${n.transactionId ? `
            <a href="#/transaction/${n.transactionId}"
              class="btn btn-ghost btn-sm"
              style="padding:2px 8px;height:auto;font-size:11px"
              onclick="event.stopPropagation()">
              Audit Transaction ${icon('chevronRight', { size: 10 })}
            </a>` : ''}
        </div>
      </div>
      <span class="badge badge-${n.riskLevel === 'high' ? 'high' : n.riskLevel === 'medium' ? 'medium' : 'neutral'}"
        style="flex-shrink:0;align-self:flex-start">
        ${n.riskLevel === 'high' ? 'High Risk' : n.riskLevel === 'medium' ? 'Medium Risk' : 'Info'}
      </span>
    </div>`;
}

function mountNotifActions(notifs, ctx) {
  const { user } = ctx;

  document.getElementById('mark-all-read')?.addEventListener('click', () => {
    Notifications.markAllRead(user.id);
    updateBell(user.id);
    window.showToast('All alerts marked as read.', 'success');
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

function formatRelative(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  try { return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function esc(s) { return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
