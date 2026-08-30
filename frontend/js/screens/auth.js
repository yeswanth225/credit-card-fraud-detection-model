/**
 * auth.js — High-Precision Authentication & Security Gate for cred ai
 * Features subtle 3D financial network background and instant demo autofill.
 */

import { Auth } from '../store.js';
import { icon } from '../icons.js';
import { AuthNetworkVisualizer } from '../visualizations/auth-network.js';

const APP = () => document.getElementById('app');
let _bgVisualizer = null;

export function renderAuth(screenName, params, ctx) {
  if (_bgVisualizer) {
    _bgVisualizer.dispose();
    _bgVisualizer = null;
  }

  switch (screenName) {
    case 'login':           return renderLogin(ctx);
    case 'signup':          return renderSignup(ctx);
    case 'forgot-password': return renderForgotPassword(ctx);
    case 'reset-password':  return renderResetPassword(params.token, ctx);
  }
}

/* ---- Login Screen ---- */
function renderLogin(ctx) {
  APP().innerHTML = `
    <div class="auth-shell">
      <div class="auth-bg-canvas" id="auth-bg-canvas"></div>

      <div class="auth-card">
        <div class="auth-brand-badge">
          <div class="sidebar-logo-mark">cr</div>
          <span class="sidebar-brand" style="font-size:15px">cred ai <span class="sidebar-brand-ai">PROD</span></span>
        </div>

        <h1 class="auth-heading">Risk Operations Gate</h1>
        <p class="auth-subheading">Enter your security credentials to access the financial intelligence terminal.</p>

        <div id="auth-error" class="alert alert-error" style="display:none;margin-bottom:16px">
          <span class="alert-icon">${icon('alertTriangle', { size: 14 })}</span><span id="auth-error-msg"></span>
        </div>

        <form id="login-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="login-email">Analyst Identity (Email) <span class="required">*</span></label>
            <input class="form-input" id="login-email" name="email" type="email"
              autocomplete="username" placeholder="analyst@cred.ai" value="analyst@cred.ai" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">
              Security Token / Password <span class="required">*</span>
              <a href="#/forgot-password" style="float:right;font-weight:400;font-size:11px;color:var(--c-text-3)">Forgot password?</a>
            </label>
            <input class="form-input" id="login-password" name="password" type="password"
              autocomplete="current-password" placeholder="••••••••" value="demo123" required>
          </div>

          <div class="toggle-row" style="padding:4px 0 16px 0">
            <label class="checkbox-group" style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--c-text-2)">
              <input type="checkbox" id="remember-me" checked>
              <span>Keep session authenticated</span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" id="login-btn" style="width:100%">
            ${icon('lock', { size: 14 })} Sign In to cred ai
          </button>
        </form>

        <div class="auth-demo-box">
          <div class="auth-demo-title">
            ${icon('zap', { size: 12 })} Demo Quick Fill:
          </div>
          <div style="display:flex;gap:6px;margin-top:4px">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-analyst" style="flex:1;font-size:10px">
              Analyst (analyst@cred.ai)
            </button>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;font-size:11px;color:var(--c-text-3)">
          <a href="#/signup" style="color:var(--c-text-2);text-decoration:underline">Create an Account</a>
          <a href="#/about" style="color:var(--c-text-3)">Architecture & Methodology →</a>
        </div>
      </div>
    </div>`;

  const canvasContainer = document.getElementById('auth-bg-canvas');
  if (canvasContainer) {
    _bgVisualizer = new AuthNetworkVisualizer(canvasContainer);
  }

  document.getElementById('btn-fill-analyst')?.addEventListener('click', () => {
    document.getElementById('login-email').value = 'analyst@cred.ai';
    document.getElementById('login-password').value = 'demo123';
  });

  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    hideAuthError();
    if (!email || !password) { showAuthError('Please enter your email and password.'); return; }

    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
      await delay(200);
      Auth.login(email, password);
      if (_bgVisualizer) _bgVisualizer.dispose();
      ctx.navigate('/dashboard');
    } catch (err) {
      showAuthError(err.message);
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    }
  });
}

/* ---- Sign Up ---- */
function renderSignup(ctx) {
  APP().innerHTML = `
    <div class="auth-shell">
      <div class="auth-bg-canvas" id="auth-bg-canvas"></div>

      <div class="auth-card">
        <div class="auth-brand-badge">
          <div class="sidebar-logo-mark">cr</div>
          <span class="sidebar-brand" style="font-size:15px">cred ai <span class="sidebar-brand-ai">PROD</span></span>
        </div>

        <h1 class="auth-heading">Register Risk Profile</h1>
        <p class="auth-subheading">Initialize a new credential for the cred ai intelligence platform.</p>

        <div id="auth-error" class="alert alert-error" style="display:none;margin-bottom:16px">
          <span class="alert-icon">${icon('alertTriangle', { size: 14 })}</span><span id="auth-error-msg"></span>
        </div>

        <form id="signup-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="signup-name">Full Name <span class="required">*</span></label>
            <input class="form-input" id="signup-name" type="text" autocomplete="name" placeholder="Agent or Analyst Name" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="signup-email">Work Email <span class="required">*</span></label>
            <input class="form-input" id="signup-email" type="email" autocomplete="username" placeholder="analyst@enterprise.com" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="signup-password">Master Password <span class="required">*</span></label>
            <input class="form-input" id="signup-password" type="password" autocomplete="new-password" placeholder="At least 6 characters" required>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" id="signup-btn" style="width:100%;margin-top:12px">
            Complete Registration
          </button>
        </form>

        <p style="text-align:center;font-size:12px;color:var(--c-text-3);margin-top:20px">
          Already registered? <a href="#/login" style="color:var(--c-text-1);font-weight:600">Sign in</a>
        </p>
      </div>
    </div>`;

  const canvasContainer = document.getElementById('auth-bg-canvas');
  if (canvasContainer) {
    _bgVisualizer = new AuthNetworkVisualizer(canvasContainer);
  }

  document.getElementById('signup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('signup-btn');
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    hideAuthError();

    if (!name || !email || !password) { showAuthError('Please fill in all required fields.'); return; }
    if (password.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }

    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
      await delay(200);
      Auth.signup(email, password, name);
      if (_bgVisualizer) _bgVisualizer.dispose();
      ctx.navigate('/dashboard');
    } catch (err) {
      showAuthError(err.message);
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    }
  });
}

/* ---- Forgot Password ---- */
function renderForgotPassword(ctx) {
  APP().innerHTML = `
    <div class="auth-shell">
      <div class="auth-bg-canvas" id="auth-bg-canvas"></div>

      <div class="auth-card">
        <h1 class="auth-heading">Reset Password</h1>
        <p class="auth-subheading">Enter your email and we'll generate a password recovery token.</p>

        <div id="auth-error" class="alert alert-error" style="display:none;margin-bottom:16px">
          <span class="alert-icon">${icon('alertTriangle', { size: 14 })}</span><span id="auth-error-msg"></span>
        </div>

        <form id="forgot-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="forgot-email">Account Email</label>
            <input class="form-input" id="forgot-email" type="email" placeholder="analyst@cred.ai" required>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" id="forgot-btn" style="width:100%;margin-top:12px">
            Generate Reset Token
          </button>
        </form>

        <p style="text-align:center;font-size:12px;color:var(--c-text-3);margin-top:20px">
          Remember password? <a href="#/login" style="color:var(--c-text-1);font-weight:600">Back to login</a>
        </p>
      </div>
    </div>`;

  const canvasContainer = document.getElementById('auth-bg-canvas');
  if (canvasContainer) {
    _bgVisualizer = new AuthNetworkVisualizer(canvasContainer);
  }

  document.getElementById('forgot-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('forgot-btn');
    const email = document.getElementById('forgot-email').value.trim();
    hideAuthError();
    if (!email) { showAuthError('Please enter your email.'); return; }

    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
      await delay(200);
      const token = Auth.createResetToken(email);
      ctx.navigate(`/reset-password/${token}`);
    } catch (err) {
      showAuthError(err.message);
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    }
  });
}

/* ---- Reset Password ---- */
function renderResetPassword(token, ctx) {
  const tokenData = Auth.getResetToken(token);
  if (!tokenData) {
    ctx.navigate('/login');
    return;
  }

  APP().innerHTML = `
    <div class="auth-shell">
      <div class="auth-card">
        <h1 class="auth-heading">Set New Password</h1>
        <p class="auth-subheading">Resetting access for <strong>${esc(tokenData.email)}</strong></p>

        <div id="auth-error" class="alert alert-error" style="display:none;margin-bottom:16px">
          <span class="alert-icon">${icon('alertTriangle', { size: 14 })}</span><span id="auth-error-msg"></span>
        </div>

        <form id="reset-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="reset-pwd">New Password</label>
            <input class="form-input" id="reset-pwd" type="password" placeholder="At least 6 characters" required>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" id="reset-btn" style="width:100%;margin-top:12px">
            Update Password & Sign In
          </button>
        </form>
      </div>
    </div>`;

  document.getElementById('reset-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('reset-btn');
    const pwd = document.getElementById('reset-pwd').value;
    hideAuthError();
    if (!pwd || pwd.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }

    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
      await delay(200);
      Auth.resetPassword(token, pwd);
      window.showToast('Password reset successfully. Please sign in.', 'success');
      ctx.navigate('/login');
    } catch (err) {
      showAuthError(err.message);
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    }
  });
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  const msgEl = document.getElementById('auth-error-msg');
  if (el && msgEl) { msgEl.textContent = msg; el.style.display = 'flex'; }
}
function hideAuthError() {
  const el = document.getElementById('auth-error');
  if (el) el.style.display = 'none';
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
