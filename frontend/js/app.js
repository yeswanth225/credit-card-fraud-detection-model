/**
 * app.js — Client-Side Router, Shell Navigation, Command Palette & Utilities for cred ai
 */

import { Auth, Batches, Notifications } from './store.js';
import { icon } from './icons.js';
import { updateBell } from './notifications.js';
import { renderAuth } from './screens/auth.js';
import { renderDashboard } from './screens/dashboard.js';
import { renderTransaction } from './screens/transaction.js';
import { renderSingleCheck } from './screens/single-check.js';
import { renderTransactionsScreen } from './screens/transactions-screen.js';
import { renderModelPerformance } from './screens/model-performance.js';
import { renderHistory } from './screens/history.js';
import { renderSettings } from './screens/settings.js';
import { renderNotifications } from './screens/notifications-screen.js';
import { renderAbout } from './screens/about.js';

/* ================================================================
   Theme Management — Light / Dark mode with persistent storage
================================================================ */
export const ThemeManager = {
  get() {
    return localStorage.getItem('cred_theme') || 'dark';
  },
  set(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cred_theme', theme);
    const btns = document.querySelectorAll('#theme-toggle-btn');
    btns.forEach(btn => {
      btn.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon', { size: 16 });
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      btn.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    });
    window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme } }));
  },
  toggle() {
    const next = this.get() === 'dark' ? 'light' : 'dark';
    this.set(next);
    return next;
  },
  init() {
    const current = this.get();
    document.documentElement.setAttribute('data-theme', current);
  }
};

// Initialize theme immediately
ThemeManager.init();

/* ================================================================
   Global helpers — exposed on window so screens can call them.
================================================================ */
window.navigate = navigate;
window.ThemeManager = ThemeManager;
window.openCommandPalette = openCommandPalette;

export function navigate(path) {
  window.location.hash = '#' + path;
}

export function showToast(message, type = 'info', duration = 4500) {
  document.getElementById('cred-toast')?.remove();
  const iconName = type === 'success' ? 'check' : type === 'error' ? 'alertTriangle' : type === 'warning' ? 'alertTriangle' : 'info';
  const el = document.createElement('div');
  el.id = 'cred-toast';
  el.className = `toast toast-${type}`;
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', 'assertive');
  el.innerHTML = `
    <span class="toast-icon">${icon(iconName, { size: 15 })}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Dismiss">${icon('x', { size: 13 })}</button>`;
  document.body.appendChild(el);
  const close = () => { el.classList.add('toast-exit'); setTimeout(() => el.remove(), 220); };
  el.querySelector('.toast-close').addEventListener('click', close);
  requestAnimationFrame(() => el.classList.add('toast-visible'));
  setTimeout(close, duration);
}

export function showModal(html, onMount) {
  closeModal();
  const ov = document.createElement('div');
  ov.id = 'cred-modal-overlay';
  ov.className = 'modal-overlay';
  ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(ov);
  const escH = e => { if (e.key === 'Escape') closeModal(); };
  document.addEventListener('keydown', escH);
  ov._esc = escH;
  ov.addEventListener('click', e => { if (e.target === ov) closeModal(); });
  requestAnimationFrame(() => ov.classList.add('modal-visible'));
  if (onMount) onMount(ov.querySelector('.modal'));
}

export function closeModal() {
  const ov = document.getElementById('cred-modal-overlay');
  if (!ov) return;
  document.removeEventListener('keydown', ov._esc);
  ov.classList.remove('modal-visible');
  setTimeout(() => ov.remove(), 220);
}

/* ================================================================
   Command Palette (Quick Actions & Search)
================================================================ */
export function openCommandPalette() {
  closeModal();
  const user = Auth.currentUser();
  const allTxs = user ? Batches.list(user.id).flatMap(b => b.transactions || []) : [];

  const dialogHTML = `
    <div class="cmd-dialog" role="dialog" aria-modal="true" aria-label="Command Palette">
      <div class="cmd-input-wrap">
        ${icon('search', { size: 16, className: 'muted' })}
        <input class="cmd-input" id="cmd-search-input" placeholder="Type a command, merchant, or jump to page..." autofocus>
        <span class="sidebar-search-kbd">ESC</span>
      </div>
      <div class="cmd-list" id="cmd-results-list">
        <div style="font-size:10px;font-weight:700;color:var(--c-text-3);text-transform:uppercase;padding:6px 12px">Navigation & Operations</div>
        <div class="cmd-item" data-action="nav" data-path="/dashboard">
          <span>${icon('grid', { size: 14 })} Dashboard</span>
          <span style="font-size:11px;color:var(--c-text-3)">Jump</span>
        </div>
        <div class="cmd-item" data-action="nav" data-path="/single-check">
          <span>${icon('zap', { size: 14 })} Quick Single Check</span>
          <span style="font-size:11px;color:var(--c-text-3)">Audit</span>
        </div>
        <div class="cmd-item" data-action="nav" data-path="/transactions">
          <span>${icon('creditCard', { size: 14 })} All Transactions Ledger</span>
          <span style="font-size:11px;color:var(--c-text-3)">View</span>
        </div>
        <div class="cmd-item" data-action="nav" data-path="/notifications">
          <span>${icon('bell', { size: 14 })} Security Alerts</span>
          <span style="font-size:11px;color:var(--c-text-3)">Review</span>
        </div>
        <div class="cmd-item" data-action="nav" data-path="/model-performance">
          <span>${icon('trendingUp', { size: 14 })} Model Performance & Benchmarks</span>
          <span style="font-size:11px;color:var(--c-text-3)">Evaluate</span>
        </div>
        <div class="cmd-item" data-action="nav" data-path="/history">
          <span>${icon('clock', { size: 14 })} Audit History</span>
          <span style="font-size:11px;color:var(--c-text-3)">Logs</span>
        </div>
        <div class="cmd-item" data-action="nav" data-path="/settings">
          <span>${icon('settings', { size: 14 })} Settings & Appearance</span>
          <span style="font-size:11px;color:var(--c-text-3)">Config</span>
        </div>
        <div class="cmd-item" data-action="theme">
          <span>${icon('sun', { size: 14 })} Toggle Theme (Light / Dark)</span>
          <span style="font-size:11px;color:var(--c-text-3)">Switch</span>
        </div>
      </div>
    </div>`;

  const ov = document.createElement('div');
  ov.id = 'cred-modal-overlay';
  ov.className = 'modal-overlay';
  ov.innerHTML = dialogHTML;
  document.body.appendChild(ov);

  const escH = e => { if (e.key === 'Escape') closeModal(); };
  document.addEventListener('keydown', escH);
  ov._esc = escH;
  ov.addEventListener('click', e => { if (e.target === ov) closeModal(); });

  requestAnimationFrame(() => {
    ov.classList.add('modal-visible');
    const input = document.getElementById('cmd-search-input');
    input?.focus();
  });

  const input = ov.querySelector('#cmd-search-input');
  const list = ov.querySelector('#cmd-results-list');

  input?.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) return;

    const matchedTxs = allTxs.filter(t =>
      (t.merchant || '').toLowerCase().includes(q) ||
      (t.id || '').toLowerCase().includes(q)
    ).slice(0, 5);

    let html = `
      <div style="font-size:10px;font-weight:700;color:var(--c-text-3);text-transform:uppercase;padding:6px 12px">Search Results (${matchedTxs.length})</div>`;

    if (matchedTxs.length) {
      matchedTxs.forEach(t => {
        html += `
          <div class="cmd-item" data-action="nav" data-path="/transaction/${t.id}">
            <div style="display:flex;align-items:center;gap:8px">
              ${icon('creditCard', { size: 14 })}
              <span><strong>${t.merchant}</strong> · ₹${Number(t.amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <span class="score-pill ${t.classical?.flag ? 'high' : 'low'}">${Math.round((t.classical?.score || 0) * 100)}%</span>
          </div>`;
      });
    }

    html += `
      <div style="font-size:10px;font-weight:700;color:var(--c-text-3);text-transform:uppercase;padding:6px 12px;margin-top:6px">Navigation</div>
      <div class="cmd-item" data-action="nav" data-path="/dashboard"><span>${icon('grid', { size: 14 })} Dashboard</span></div>
      <div class="cmd-item" data-action="nav" data-path="/single-check"><span>${icon('zap', { size: 14 })} Quick Single Check</span></div>
      <div class="cmd-item" data-action="nav" data-path="/transactions"><span>${icon('creditCard', { size: 14 })} Transactions</span></div>
      <div class="cmd-item" data-action="nav" data-path="/model-performance"><span>${icon('trendingUp', { size: 14 })} Model Performance</span></div>`;

    list.innerHTML = html;
  });

  list?.addEventListener('click', e => {
    const item = e.target.closest('.cmd-item');
    if (!item) return;
    const action = item.dataset.action;
    const path = item.dataset.path;
    closeModal();
    if (action === 'nav' && path) {
      navigate(path);
    } else if (action === 'theme') {
      ThemeManager.toggle();
    }
  });
}

// Global keyboard shortcut: Ctrl+K or Cmd+K
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openCommandPalette();
  }
});

/* ================================================================
   Shared Application Shell Components
================================================================ */
export function sidebarHTML(user, activePage) {
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const count = user ? (window._cred_bellCount || 0) : 0;
  const nav = [
    { id: 'dashboard', iconName: 'grid', label: 'Dashboard', path: '/dashboard' },
    { id: 'single-check', iconName: 'zap', label: 'Quick Check', path: '/single-check' },
    { id: 'transactions', iconName: 'creditCard', label: 'Transactions', path: '/transactions' },
    { id: 'notifications', iconName: 'bell', label: 'Alerts', path: '/notifications',
      badge: count > 0 ? (count > 99 ? '99+' : String(count)) : null },
    { id: 'history', iconName: 'clock', label: 'History', path: '/history' },
    { id: 'model-performance', iconName: 'trendingUp', label: 'Model Performance', path: '/model-performance' },
    { id: 'settings', iconName: 'settings', label: 'Settings', path: '/settings' },
    { id: 'about', iconName: 'info', label: 'Architecture & Spec', path: '/about' },
  ];

  return `
    <aside class="sidebar" id="sidebar" aria-label="Main navigation">
      <div class="sidebar-brand-wrap" onclick="navigate('/dashboard')" role="link" tabindex="0" aria-label="cred ai home">
        <div class="sidebar-logo-group">
          <div class="sidebar-logo-mark">cr</div>
          <span class="sidebar-brand">cred ai <span class="sidebar-brand-ai">PROD</span></span>
        </div>
        <span class="sidebar-status-dot" title="ML Inference: Active (Online)"></span>
      </div>

      <button class="sidebar-search-btn" id="sidebar-search-trigger" onclick="openCommandPalette()" type="button" aria-label="Command search">
        <span style="display:flex;align-items:center;gap:6px">${icon('search', { size: 13 })} Quick Search</span>
        <span class="sidebar-search-kbd">⌘K</span>
      </button>

      <nav class="sidebar-nav" aria-label="Application">
        ${nav.map(item => `
          <a class="nav-item${activePage === item.id ? ' active' : ''}"
             href="#${item.path}"
             aria-current="${activePage === item.id ? 'page' : 'false'}">
            <span class="nav-icon" aria-hidden="true">${icon(item.iconName, { size: 15 })}</span>
            <span>${item.label}</span>
            ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
          </a>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user-avatar" aria-hidden="true">${initials}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${user?.name || 'Fraud Analyst'}</div>
          <div class="sidebar-user-role">Risk Operations</div>
        </div>
        <button class="sidebar-logout" id="logout-btn" title="Sign out" aria-label="Sign out">
          ${icon('logOut', { size: 15 })}
        </button>
      </div>
    </aside>`;
}

export function headerHTML(title, breadcrumb, user) {
  const count = user ? window._cred_bellCount || 0 : 0;
  const currentTheme = ThemeManager.get();

  return `
    <header class="main-header">
      <div class="main-header-left">
        <button class="sidebar-toggle" id="sidebar-toggle-btn" aria-label="Open navigation" aria-expanded="false">
          ${icon('menu', { size: 16 })}
        </button>
        ${breadcrumb
          ? `<nav class="page-breadcrumb" aria-label="Breadcrumb">${breadcrumb}</nav>`
          : `<h1 class="page-title">${title}</h1>`
        }
      </div>
      <div class="main-header-right">
        <div class="header-system-status">
          <span style="width:6px;height:6px;border-radius:50%;background:var(--c-low);display:inline-block"></span>
          Hybrid ML: Online
        </div>
        <button class="theme-toggle-btn" id="theme-toggle-btn"
          aria-label="Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} theme"
          title="Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} theme">
          ${icon(currentTheme === 'dark' ? 'sun' : 'moon', { size: 15 })}
        </button>
        <button class="notif-bell" id="notif-bell-btn"
          onclick="navigate('/notifications')"
          aria-label="Notifications${count > 0 ? ` (${count} unread)` : ''}">
          ${icon('bell', { size: 15 })}
          <span class="notif-bell-count" id="notif-bell-count"
            style="display:${count > 0 ? 'flex' : 'none'}">${count > 99 ? '99+' : count}</span>
        </button>
      </div>
    </header>`;
}

export function mountSidebarToggle() {
  const btn = document.getElementById('sidebar-toggle-btn');
  const sidebar = document.getElementById('sidebar');
  if (!btn || !sidebar) return;
  let overlay = document.getElementById('sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }
  btn.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    overlay.classList.toggle('visible', open);
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('visible');
  });
}

export function mountLogout(ctx) {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    Auth.logout();
    ctx.navigate('/login');
  });
}

/* ================================================================
   Router
================================================================ */
const PUBLIC  = new Set(['/login', '/signup', '/forgot-password', '/about']);

function parsePath() {
  const hash = window.location.hash;
  const path = hash ? hash.slice(1) : '/login';
  return path || '/login';
}

function parseRoute(path) {
  if (path === '/login')               return { name: 'login', params: {} };
  if (path === '/signup')              return { name: 'signup', params: {} };
  if (path === '/forgot-password')     return { name: 'forgot-password', params: {} };
  if (path.startsWith('/reset-password/'))
    return { name: 'reset-password', params: { token: path.slice('/reset-password/'.length) } };
  if (path === '/dashboard')           return { name: 'dashboard', params: {} };
  if (path.startsWith('/transaction/'))
    return { name: 'transaction', params: { id: path.slice('/transaction/'.length) } };
  if (path === '/single-check' || path === '/quick-check') return { name: 'single-check', params: {} };
  if (path === '/transactions')        return { name: 'transactions', params: {} };
  if (path === '/history')             return { name: 'history', params: {} };
  if (path.startsWith('/history/'))
    return { name: 'batch-detail', params: { batchId: path.slice('/history/'.length) } };
  if (path === '/model-performance')   return { name: 'model-performance', params: {} };
  if (path === '/settings')            return { name: 'settings', params: {} };
  if (path === '/notifications' || path === '/alerts') return { name: 'notifications', params: {} };
  if (path === '/about')               return { name: 'about', params: {} };
  return { name: '404', params: {} };
}

async function route() {
  const path = parsePath();
  const { name, params } = parseRoute(path);
  const user = Auth.currentUser();
  const isPublic = PUBLIC.has('/' + name) || name === 'reset-password';

  if (!user && !isPublic) { navigate('/login'); return; }
  if (user && (name === 'login' || name === 'signup')) { navigate('/dashboard'); return; }

  // Update global bell count
  if (user) {
    window._cred_bellCount = Notifications.unreadCount(user.id);
  }

  const ctx = { user, navigate, showToast, showModal, closeModal };

  switch (name) {
    case 'login':
    case 'signup':
    case 'forgot-password':
    case 'reset-password':
      renderAuth(name, params, ctx); break;
    case 'dashboard':
      renderDashboard(ctx); break;
    case 'transaction':
      renderTransaction(params.id, ctx); break;
    case 'single-check':
      renderSingleCheck(ctx); break;
    case 'transactions':
      renderTransactionsScreen(ctx); break;
    case 'history':
      renderHistory(null, ctx); break;
    case 'batch-detail':
      renderHistory(params.batchId, ctx); break;
    case 'model-performance':
      renderModelPerformance(ctx); break;
    case 'settings':
      renderSettings(ctx); break;
    case 'notifications':
      renderNotifications(ctx); break;
    case 'about':
      renderAbout(ctx); break;
    default:
      document.getElementById('app').innerHTML = `
        <div class="error-page" style="text-align:center;padding:48px">
          <div style="font-size:48px;font-weight:700;margin-bottom:16px">404</div>
          <h1>Page not found</h1>
          <p style="color:var(--c-text-3);margin-top:8px">The page you're looking for doesn't exist.</p>
          <button class="btn btn-primary" style="margin-top:24px" onclick="navigate('/dashboard')">Go to Dashboard</button>
        </div>`;
  }

  if (user) updateBell(user.id);
}

// Global click handler for theme switcher button in header
document.addEventListener('click', e => {
  const btn = e.target.closest('#theme-toggle-btn');
  if (btn) {
    e.preventDefault();
    ThemeManager.toggle();
  }
});

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);
