/**
 * app.js — Client-side router and shared utilities for [cred]
 */

import { Auth } from './store.js';
import { icon } from './icons.js';
import { updateBell } from './notifications.js';
import { renderAuth } from './screens/auth.js';
import { renderDashboard } from './screens/dashboard.js';
import { renderTransaction } from './screens/transaction.js';
import { renderSingleCheck } from './screens/single-check.js';
import { renderHistory } from './screens/history.js';
import { renderSettings } from './screens/settings.js';
import { renderNotifications } from './screens/notifications-screen.js';
import { renderAbout } from './screens/about.js';

/* ================================================================
   Global helpers — exposed on window so screens can call them.
================================================================ */
window.navigate = navigate;

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
    <span class="toast-icon">${icon(iconName, { size: 16 })}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Dismiss">${icon('x', { size: 14 })}</button>`;
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
   Shared layout helpers
================================================================ */
export function sidebarHTML(user, activePage) {
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const count = user ? (window._cred_bellCount || 0) : 0;
  const nav = [
    { id: 'dashboard', iconName: 'grid', label: 'Dashboard', path: '/dashboard' },
    { id: 'single-check', iconName: 'zap', label: 'Quick Check', path: '/single-check' },
    { id: 'history', iconName: 'clock', label: 'History', path: '/history' },
    { id: 'notifications', iconName: 'bell', label: 'Alerts', path: '/notifications',
      badge: count > 0 ? (count > 99 ? '99+' : String(count)) : null },
    { id: 'about', iconName: 'helpCircle', label: 'About', path: '/about' },
    { id: 'settings', iconName: 'settings', label: 'Settings', path: '/settings' },
  ];
  return `
    <aside class="sidebar" id="sidebar" aria-label="Main navigation">
      <div class="sidebar-logo" onclick="navigate('/dashboard')" role="link" tabindex="0" aria-label="[cred] home">
        <div class="sidebar-logo-mark">cr</div>
        <span class="sidebar-brand">[cred]</span>
      </div>
      <nav class="sidebar-nav" aria-label="Application">
        ${nav.map(item => `
          <a class="nav-item${activePage === item.id ? ' active' : ''}"
             href="#${item.path}"
             aria-current="${activePage === item.id ? 'page' : 'false'}">
            <span class="nav-icon" aria-hidden="true">${icon(item.iconName, { size: 16 })}</span>
            <span>${item.label}</span>
            ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
          </a>
        `).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user-avatar" aria-hidden="true">${initials}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${user?.name || ''}</div>
          <div class="sidebar-user-email">${user?.email || ''}</div>
        </div>
        <button class="sidebar-logout" id="logout-btn" title="Sign out" aria-label="Sign out">
          ${icon('logOut', { size: 16 })}
        </button>
      </div>
    </aside>`;
}

export function headerHTML(title, breadcrumb, user) {
  const count = user ? window._cred_bellCount || 0 : 0;
  return `
    <header class="main-header">
      <div class="main-header-left">
        <button class="sidebar-toggle" id="sidebar-toggle-btn" aria-label="Open navigation" aria-expanded="false">
          ${icon('menu', { size: 18 })}
        </button>
        ${breadcrumb
          ? `<nav class="page-breadcrumb" aria-label="Breadcrumb">${breadcrumb}</nav>`
          : `<h1 class="page-title">${title}</h1>`
        }
      </div>
      <div class="main-header-right">
        <button class="notif-bell" id="notif-bell-btn"
          onclick="navigate('/notifications')"
          aria-label="Notifications${count > 0 ? ` (${count} unread)` : ''}">
          ${icon('bell', { size: 18 })}
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
  if (path === '/single-check')        return { name: 'single-check', params: {} };
  if (path === '/history')             return { name: 'history', params: {} };
  if (path.startsWith('/history/'))
    return { name: 'batch-detail', params: { batchId: path.slice('/history/'.length) } };
  if (path === '/settings')            return { name: 'settings', params: {} };
  if (path === '/notifications')       return { name: 'notifications', params: {} };
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
    const { Notifications } = await import('./store.js');
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
    case 'history':
      renderHistory(null, ctx); break;
    case 'batch-detail':
      renderHistory(params.batchId, ctx); break;
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

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);
