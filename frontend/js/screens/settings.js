/**
 * settings.js — Account Profile, Appearance, Security & System Settings for cred ai
 */

import { Auth, Batches } from '../store.js';
import { icon } from '../icons.js';
import { sidebarHTML, headerHTML, mountSidebarToggle, mountLogout, ThemeManager } from '../app.js';

const APP = () => document.getElementById('app');

let _activeTab = 'profile';

export function renderSettings(ctx) {
  const { user } = ctx;

  APP().innerHTML = `
    <div class="app-shell">
      ${sidebarHTML(user, 'settings')}
      <div class="main-content">
        ${headerHTML('Settings & Preferences', null, user)}
        <main class="page-body animate-fade-in">

          <div class="settings-grid">
            <!-- Left: Settings Nav -->
            <nav class="settings-nav" aria-label="Settings navigation">
              <button class="settings-nav-item${_activeTab === 'profile' ? ' active' : ''}" data-tab="profile">
                ${icon('user', { size: 14 })} Profile
              </button>
              <button class="settings-nav-item${_activeTab === 'appearance' ? ' active' : ''}" data-tab="appearance">
                ${icon('sun', { size: 14 })} Appearance
              </button>
              <button class="settings-nav-item${_activeTab === 'alerts' ? ' active' : ''}" data-tab="alerts">
                ${icon('bell', { size: 14 })} Alert Rules
              </button>
              <button class="settings-nav-item${_activeTab === 'security' ? ' active' : ''}" data-tab="security">
                ${icon('lock', { size: 14 })} Security
              </button>
              <button class="settings-nav-item${_activeTab === 'data' ? ' active' : ''}" data-tab="data">
                ${icon('database', { size: 14 })} Data & Storage
              </button>
            </nav>

            <!-- Right: Settings Form Panel -->
            <div class="settings-panel" id="settings-content">
              ${renderTabContent(_activeTab, user)}
            </div>
          </div>

        </main>
      </div>
    </div>`;

  mountSidebarToggle();
  mountLogout(ctx);
  mountSettingsListeners(ctx);
}

function renderTabContent(tab, user) {
  const currentTheme = ThemeManager.get();

  switch (tab) {
    case 'profile':
      return `
        <h3 class="settings-section-title">Risk Analyst Profile</h3>
        <p class="section-subtitle" style="margin-bottom:var(--sp-5)">Manage your credentials and investigator identity</p>

        <form id="profile-form">
          <div class="form-group">
            <label class="form-label" for="prof-name">Full Name</label>
            <input class="form-input" id="prof-name" value="${esc(user?.name || '')}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="prof-email">Email Address</label>
            <input class="form-input" id="prof-email" value="${esc(user?.email || '')}" disabled style="opacity:0.7">
            <div class="form-hint">Email address is managed by your enterprise directory.</div>
          </div>
          <button type="submit" class="btn btn-primary btn-sm" style="margin-top:12px">Save Profile</button>
        </form>`;

    case 'appearance':
      return `
        <h3 class="settings-section-title">Appearance & Theme</h3>
        <p class="section-subtitle" style="margin-bottom:var(--sp-5)">Customize the visual workspace for high-contrast day or dark-room operations</p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-bottom:var(--sp-5)">
          <div id="theme-card-dark" style="padding:var(--sp-4);background:#0E1219;border:2px solid ${currentTheme === 'dark' ? 'var(--c-quantum)' : 'var(--c-border)'};border-radius:var(--r-lg);cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-weight:700;font-size:13px;color:#F8FAFC">Dark Terminal (Default)</span>
              ${currentTheme === 'dark' ? `<span class="badge badge-quantum">Active</span>` : ''}
            </div>
            <div style="font-size:11px;color:#94A3B8">Deep obsidian workspace calibrated for night operations.</div>
          </div>

          <div id="theme-card-light" style="padding:var(--sp-4);background:#FFFFFF;border:2px solid ${currentTheme === 'light' ? 'var(--c-quantum)' : 'var(--c-border)'};border-radius:var(--r-lg);cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-weight:700;font-size:13px;color:#090D14">Light Clean</span>
              ${currentTheme === 'light' ? `<span class="badge badge-quantum">Active</span>` : ''}
            </div>
            <div style="font-size:11px;color:#68768A">High-contrast daytime presentation mode.</div>
          </div>
        </div>`;

    case 'alerts':
      return `
        <h3 class="settings-section-title">Alert Rules & Sensitivity</h3>
        <p class="section-subtitle" style="margin-bottom:var(--sp-5)">Configure automated incident triage triggers</p>

        <div class="toggle-row">
          <div class="toggle-info">
            <div class="toggle-name">High-Risk Intercept Notifications</div>
            <div class="toggle-desc">Trigger incident alert when transaction fraud probability ≥ 70%</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="pref-high" ${user?.notificationPrefs?.highRisk !== false ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="toggle-row">
          <div class="toggle-info">
            <div class="toggle-name">Medium-Risk 2FA Challenge Alerts</div>
            <div class="toggle-desc">Trigger incident alert when transaction fraud probability is 40–69%</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="pref-medium" ${user?.notificationPrefs?.mediumRisk ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>`;

    case 'security':
      return `
        <h3 class="settings-section-title">Security & Tokens</h3>
        <p class="section-subtitle" style="margin-bottom:var(--sp-5)">Update your master password and session settings</p>

        <form id="pwd-form">
          <div class="form-group">
            <label class="form-label" for="cur-pwd">Current Password</label>
            <input class="form-input" id="cur-pwd" type="password" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="new-pwd">New Password</label>
            <input class="form-input" id="new-pwd" type="password" placeholder="At least 6 characters" required>
          </div>
          <button type="submit" class="btn btn-primary btn-sm" style="margin-top:12px">Update Password</button>
        </form>`;

    case 'data':
      return `
        <h3 class="settings-section-title">Data & Storage Management</h3>
        <p class="section-subtitle" style="margin-bottom:var(--sp-5)">Manage local ledger data and sample records</p>

        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--c-surface-2);border-radius:var(--r-md)">
            <div>
              <div style="font-weight:600;font-size:13px">Reset & Load Sample Dataset</div>
              <div style="font-size:11px;color:var(--c-text-3)">Restore 55 curated credit card fraud benchmark transactions.</div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-reset-demo">Reset Demo</button>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--c-high-bg);border:1px solid var(--c-high-border);border-radius:var(--r-md)">
            <div>
              <div style="font-weight:600;font-size:13px;color:var(--c-high)">Purge All Local Data</div>
              <div style="font-size:11px;color:var(--c-text-2)">Permanently erase all batches, logs, and notification records.</div>
            </div>
            <button class="btn btn-danger btn-sm" id="btn-purge-data">Purge Ledger</button>
          </div>
        </div>`;
    default:
      return '';
  }
}

function mountSettingsListeners(ctx) {
  const { user } = ctx;

  document.querySelectorAll('.settings-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeTab = btn.dataset.tab;
      renderSettings(ctx);
    });
  });

  document.getElementById('theme-card-dark')?.addEventListener('click', () => {
    ThemeManager.set('dark');
    renderSettings(ctx);
  });
  document.getElementById('theme-card-light')?.addEventListener('click', () => {
    ThemeManager.set('light');
    renderSettings(ctx);
  });

  document.getElementById('profile-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('prof-name').value.trim();
    if (!name) return;
    Auth.updateUser(user.id, { name });
    window.showToast('Profile updated.', 'success');
  });

  document.getElementById('btn-reset-demo')?.addEventListener('click', () => {
    Batches.seedDataset(user.id, true);
    window.showToast('Demo dataset restored with 55 transactions.', 'success');
  });

  document.getElementById('btn-purge-data')?.addEventListener('click', () => {
    window.showModal(`
      <h2 class="modal-title">Purge All Ledger Data?</h2>
      <p class="modal-body">This will delete all stored batches, historical transactions, and notifications. This cannot be undone.</p>
      <div class="modal-actions">
        <button class="btn btn-secondary btn-sm" id="m-cancel">Cancel</button>
        <button class="btn btn-danger btn-sm" id="m-confirm">${icon('trash', { size: 12 })} Confirm Purge</button>
      </div>`, modal => {
      modal.querySelector('#m-cancel').addEventListener('click', window.closeModal);
      modal.querySelector('#m-confirm').addEventListener('click', () => {
        Batches.deleteAll(user.id);
        window.closeModal();
        window.showToast('All transaction records purged.', 'info');
        ctx.navigate('/dashboard');
      });
    });
  });
}

function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
