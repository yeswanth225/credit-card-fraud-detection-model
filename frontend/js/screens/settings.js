/**
 * settings.js — Account settings screen for [cred] (Profile, Security, Notifications)
 */

import { Auth } from '../store.js';
import { icon } from '../icons.js';
import { sidebarHTML, headerHTML, mountSidebarToggle, mountLogout } from '../app.js';

const APP = () => document.getElementById('app');

let _activeTab = 'profile';

export function renderSettings(ctx) {
  const { user } = ctx;
  _activeTab = 'profile';
  APP().innerHTML = buildShell(user, ctx);
  mountSidebarToggle();
  mountLogout(ctx);
  mountSettingsTabs(ctx);
  renderActiveTab(ctx);
}

function buildShell(user, ctx) {
  return `
    <div class="app-shell">
      ${sidebarHTML(user, 'settings')}
      <div class="main-content">
        ${headerHTML('Account Settings', null, user)}
        <main class="page-body animate-fade-in">
          <div class="settings-grid">

            <!-- Sidebar nav -->
            <nav class="settings-nav" role="tablist" aria-label="Settings sections">
              <button class="settings-nav-item active" data-tab="profile" role="tab" aria-selected="true">
                ${icon('user', { size: 16 })} Profile Information
              </button>
              <button class="settings-nav-item" data-tab="security" role="tab" aria-selected="false">
                ${icon('lock', { size: 16 })} Security & Credentials
              </button>
              <button class="settings-nav-item" data-tab="notifications" role="tab" aria-selected="false">
                ${icon('bell', { size: 16 })} Alert Preferences
              </button>
            </nav>

            <!-- Panel -->
            <div class="settings-panel" id="settings-panel"></div>

          </div>
        </main>
      </div>
    </div>`;
}

function mountSettingsTabs(ctx) {
  document.querySelectorAll('.settings-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.settings-nav-item').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      _activeTab = btn.dataset.tab;
      renderActiveTab(ctx);
    });
  });
}

function renderActiveTab(ctx) {
  const panel = document.getElementById('settings-panel');
  if (!panel) return;
  switch (_activeTab) {
    case 'profile':       renderProfileTab(panel, ctx); break;
    case 'security':      renderSecurityTab(panel, ctx); break;
    case 'notifications': renderNotificationsTab(panel, ctx); break;
  }
}

/* ================================================================
   Profile Tab
================================================================ */
function renderProfileTab(panel, ctx) {
  const user = Auth.currentUser();
  panel.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">Profile Information</div>
      <div id="profile-msg" style="display:none;margin-bottom:16px"></div>
      <form id="profile-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="p-name">Full Name</label>
          <input class="form-input" id="p-name" type="text" value="${esc(user?.name || '')}" autocomplete="name">
        </div>
        <div class="form-group">
          <label class="form-label" for="p-email">Email Address</label>
          <input class="form-input" id="p-email" type="email" value="${esc(user?.email || '')}" autocomplete="username">
          <span class="form-hint">Updating email requires password confirmation.</span>
        </div>
        <div class="form-group">
          <label class="form-label" for="p-cur-pwd">Current Password <span class="required">*</span></label>
          <input class="form-input" id="p-cur-pwd" type="password" autocomplete="current-password"
            placeholder="Enter password to confirm changes">
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button type="submit" class="btn btn-primary" id="p-save">Save Profile</button>
        </div>
      </form>
    </div>

    <div class="settings-section" style="margin-top:32px;padding-top:24px;border-top:1px solid var(--c-border)">
      <div class="settings-section-title">Account Metadata</div>
      <div style="display:flex;flex-direction:column;gap:8px;font-size:13px">
        <div style="display:flex;gap:16px"><span style="color:var(--c-text-3);width:130px">Created On</span>
          <span>${user?.createdAt ? formatDate(user.createdAt) : '—'}</span></div>
        <div style="display:flex;gap:16px"><span style="color:var(--c-text-3);width:130px">User Identifier</span>
          <span style="font-family:var(--font-mono);font-size:11px;color:var(--c-text-3)">${esc(user?.id || '—')}</span></div>
      </div>
    </div>`;

  document.getElementById('profile-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn  = document.getElementById('p-save');
    const name = document.getElementById('p-name').value.trim();
    const email= document.getElementById('p-email').value.trim();
    const pwd  = document.getElementById('p-cur-pwd').value;
    hideMsg('profile-msg');
    if (!pwd) { showMsg('profile-msg', 'error', 'Please enter your current password to save changes.'); return; }
    btn.classList.add('btn-loading'); btn.disabled = true;
    try {
      await delay(150);
      const updated = Auth.updateProfile(ctx.user.id, { name, email, currentPassword: pwd });
      ctx.user.name  = updated.name;
      ctx.user.email = updated.email;
      document.getElementById('p-cur-pwd').value = '';
      showMsg('profile-msg', 'success', 'Profile updated successfully.');
      document.querySelector('.sidebar-user-name')&&(document.querySelector('.sidebar-user-name').textContent = updated.name);
      document.querySelector('.sidebar-user-email')&&(document.querySelector('.sidebar-user-email').textContent = updated.email);
    } catch(err) {
      showMsg('profile-msg', 'error', err.message);
    }
    btn.classList.remove('btn-loading'); btn.disabled = false;
  });
}

/* ================================================================
   Security Tab
================================================================ */
function renderSecurityTab(panel, ctx) {
  panel.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">Change Password</div>
      <div id="sec-msg" style="display:none;margin-bottom:16px"></div>
      <form id="security-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="s-cur">Current Password <span class="required">*</span></label>
          <input class="form-input" id="s-cur" type="password" autocomplete="current-password" placeholder="Your existing password">
        </div>
        <div class="form-group">
          <label class="form-label" for="s-new">New Password <span class="required">*</span></label>
          <input class="form-input" id="s-new" type="password" autocomplete="new-password" placeholder="At least 8 characters">
          <span class="form-hint">Must be at least 8 characters.</span>
        </div>
        <div class="form-group">
          <label class="form-label" for="s-new2">Confirm New Password <span class="required">*</span></label>
          <input class="form-input" id="s-new2" type="password" autocomplete="new-password" placeholder="Repeat new password">
        </div>
        <button type="submit" class="btn btn-primary" id="s-save">Update Password</button>
      </form>
    </div>

    <div class="settings-section" style="margin-top:32px;padding-top:24px;border-top:1px solid var(--c-border)">
      <div class="settings-section-title">Active Session</div>
      <p style="font-size:13px;color:var(--c-text-3);margin-bottom:12px">Terminating your session will log you out from this device.</p>
      <button class="btn btn-danger-outline" id="logout-settings-btn">
        ${icon('logOut', { size: 14 })} Sign Out of Current Session
      </button>
    </div>`;

  document.getElementById('security-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn  = document.getElementById('s-save');
    const cur  = document.getElementById('s-cur').value;
    const nw   = document.getElementById('s-new').value;
    const nw2  = document.getElementById('s-new2').value;
    hideMsg('sec-msg');
    if (!cur) { showMsg('sec-msg', 'error', 'Please enter your current password.'); return; }
    if (nw.length < 8) { showMsg('sec-msg', 'error', 'New password must be at least 8 characters.'); return; }
    if (nw !== nw2)    { showMsg('sec-msg', 'error', 'New passwords do not match.'); return; }
    btn.classList.add('btn-loading'); btn.disabled = true;
    try {
      await delay(150);
      Auth.changePassword(ctx.user.id, cur, nw);
      document.getElementById('s-cur').value = '';
      document.getElementById('s-new').value = '';
      document.getElementById('s-new2').value = '';
      showMsg('sec-msg', 'success', 'Password updated successfully.');
    } catch(err) {
      showMsg('sec-msg', 'error', err.message);
    }
    btn.classList.remove('btn-loading'); btn.disabled = false;
  });

  document.getElementById('logout-settings-btn')?.addEventListener('click', () => {
    Auth.logout();
    ctx.navigate('/login');
  });
}

/* ================================================================
   Notifications Tab
================================================================ */
function renderNotificationsTab(panel, ctx) {
  const user = Auth.currentUser();
  const prefs = user?.notificationPrefs || { highRisk: true, mediumRisk: false, emailEnabled: false };

  panel.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">In-App Alert Thresholds</div>
      <p style="font-size:13px;color:var(--c-text-3);margin-bottom:16px">
        Choose which fraud probability levels generate notifications during batch or real-time triage.
      </p>
      <div id="notif-msg" style="display:none;margin-bottom:16px"></div>
      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-name">High Risk Alerts (≥ 70%)</div>
          <div class="toggle-desc">Trigger notification when fraud probability is critically high</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="pref-high" ${prefs.highRisk ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-name">Medium Risk Alerts (40–69%)</div>
          <div class="toggle-desc">Trigger notification for moderate risk variances</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="pref-medium" ${prefs.mediumRisk ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="settings-section" style="margin-top:24px;padding-top:24px;border-top:1px solid var(--c-border)">
      <div class="settings-section-title">Email Dispatch</div>
      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-name">Real-Time Email Webhooks</div>
          <div class="toggle-desc">Dispatch email digests for high risk alerts</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="pref-email" ${prefs.emailEnabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <div style="margin-top:24px">
      <button class="btn btn-primary" id="notif-save">Save Alert Preferences</button>
    </div>`;

  document.getElementById('notif-save')?.addEventListener('click', async () => {
    const btn = document.getElementById('notif-save');
    const newPrefs = {
      highRisk:     document.getElementById('pref-high')?.checked ?? true,
      mediumRisk:   document.getElementById('pref-medium')?.checked ?? false,
      emailEnabled: document.getElementById('pref-email')?.checked ?? false,
    };
    btn.classList.add('btn-loading'); btn.disabled = true;
    await delay(150);
    try {
      Auth.updateNotificationPrefs(ctx.user.id, newPrefs);
      ctx.user.notificationPrefs = newPrefs;
      showMsg('notif-msg', 'success', 'Alert preferences saved.');
    } catch(err) {
      showMsg('notif-msg', 'error', err.message);
    }
    btn.classList.remove('btn-loading'); btn.disabled = false;
    renderNotificationsTab(panel, ctx);
  });
}

function showMsg(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.style.display = 'flex';
  el.innerHTML = `<span class="alert-icon">${icon(type === 'success' ? 'check' : 'x', { size: 16 })}</span><span>${msg}</span>`;
}
function hideMsg(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }); } catch { return iso; }
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(s) { return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
