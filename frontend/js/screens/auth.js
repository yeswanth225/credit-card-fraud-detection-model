/**
 * auth.js — Signup, Login, Forgot Password, Reset Password screens
 */

import { Auth } from '../store.js';
import { icon } from '../icons.js';

const APP = () => document.getElementById('app');

export function renderAuth(screenName, params, ctx) {
  switch (screenName) {
    case 'login':          return renderLogin(ctx);
    case 'signup':         return renderSignup(ctx);
    case 'forgot-password':return renderForgotPassword(ctx);
    case 'reset-password': return renderResetPassword(params.token, ctx);
  }
}

/* ---- Login ---- */
function renderLogin(ctx) {
  APP().innerHTML = `
    <div class="auth-shell">
      <div class="auth-card animate-fade-in">
        <div class="auth-logo">
          <div class="auth-logo-mark">cr</div>
          <span class="auth-brand">[cred]</span>
        </div>
        <h1 class="auth-heading">Welcome back</h1>
        <p class="auth-subheading">Sign in to your fraud detection dashboard</p>

        <div id="auth-error" class="alert alert-error" style="display:none;margin-bottom:16px">
          <span class="alert-icon">${icon('x', { size: 16 })}</span><span id="auth-error-msg"></span>
        </div>

        <form id="login-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="login-email">Email address <span class="required">*</span></label>
            <input class="form-input" id="login-email" name="email" type="email"
              autocomplete="username" placeholder="you@example.com" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">
              Password <span class="required">*</span>
              <a href="#/forgot-password" style="float:right;font-weight:400;font-size:12px;color:var(--c-text-3)">Forgot password?</a>
            </label>
            <input class="form-input" id="login-password" name="password" type="password"
              autocomplete="current-password" placeholder="••••••••" required>
          </div>
          <div class="checkbox-group" style="margin-bottom:24px">
            <input type="checkbox" id="remember-me">
            <label class="checkbox-label" for="remember-me">Remember me</label>
          </div>
          <button type="submit" class="btn btn-primary btn-xl" id="login-btn" style="width:100%">
            Sign in
          </button>
        </form>

        <p class="auth-footer-link">
          Don't have an account? <a href="#/signup">Create account</a>
        </p>
        <div style="margin-top:16px;text-align:center">
          <a href="#/about" style="font-size:12px;color:var(--c-text-3);text-decoration:none">
            About [cred] & Quantum Engine →
          </a>
        </div>
      </div>
    </div>`;

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
      <div class="auth-card animate-fade-in">
        <div class="auth-logo">
          <div class="auth-logo-mark">cr</div>
          <span class="auth-brand">[cred]</span>
        </div>
        <h1 class="auth-heading">Create account</h1>
        <p class="auth-subheading">Start detecting fraud in your transactions</p>

        <div id="auth-error" class="alert alert-error" style="display:none;margin-bottom:16px">
          <span class="alert-icon">${icon('x', { size: 16 })}</span><span id="auth-error-msg"></span>
        </div>

        <form id="signup-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="su-name">Full name <span class="required">*</span></label>
            <input class="form-input" id="su-name" type="text" autocomplete="name" placeholder="Priya Sharma" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="su-email">Email address <span class="required">*</span></label>
            <input class="form-input" id="su-email" type="email" autocomplete="username" placeholder="priya@example.com" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="su-pwd">Password <span class="required">*</span></label>
            <input class="form-input" id="su-pwd" type="password" autocomplete="new-password" placeholder="At least 8 characters" required minlength="8">
            <span class="form-hint">Must be at least 8 characters.</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="su-pwd2">Confirm password <span class="required">*</span></label>
            <input class="form-input" id="su-pwd2" type="password" autocomplete="new-password" placeholder="Repeat password" required>
          </div>
          <button type="submit" class="btn btn-primary btn-xl" id="su-btn" style="width:100%;margin-top:8px">
            Create account
          </button>
        </form>

        <p class="auth-footer-link">Already have an account? <a href="#/login">Sign in</a></p>
      </div>
    </div>`;

  document.getElementById('signup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('su-btn');
    const name  = document.getElementById('su-name').value.trim();
    const email = document.getElementById('su-email').value.trim();
    const pwd   = document.getElementById('su-pwd').value;
    const pwd2  = document.getElementById('su-pwd2').value;
    hideAuthError();

    if (!name)  { showAuthError('Please enter your name.'); return; }
    if (!email) { showAuthError('Please enter your email address.'); return; }
    if (pwd.length < 8) { showAuthError('Password must be at least 8 characters.'); return; }
    if (pwd !== pwd2)   { showAuthError('Passwords do not match.'); return; }

    btn.classList.add('btn-loading');
    btn.disabled = true;
    try {
      await delay(250);
      Auth.register(name, email, pwd);
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
      <div class="auth-card animate-fade-in">
        <div class="auth-logo">
          <div class="auth-logo-mark">cr</div>
          <span class="auth-brand">[cred]</span>
        </div>
        <h1 class="auth-heading">Reset password</h1>
        <p class="auth-subheading">Enter your email and we'll send a reset link</p>

        <div id="fp-success" class="alert alert-success" style="display:none;margin-bottom:16px">
          <span class="alert-icon">${icon('check', { size: 16 })}</span>
          <span>If that email is registered, a reset link has been generated.
            <span id="demo-reset-link" style="display:none;margin-top:8px;display:block"></span>
          </span>
        </div>
        <div id="auth-error" class="alert alert-error" style="display:none;margin-bottom:16px">
          <span class="alert-icon">${icon('x', { size: 16 })}</span><span id="auth-error-msg"></span>
        </div>

        <form id="fp-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="fp-email">Email address <span class="required">*</span></label>
            <input class="form-input" id="fp-email" type="email" autocomplete="username" placeholder="you@example.com" required>
          </div>
          <button type="submit" class="btn btn-primary btn-xl" id="fp-btn" style="width:100%">
            Send reset link
          </button>
        </form>
        <p class="auth-footer-link"><a href="#/login">← Back to sign in</a></p>
      </div>
    </div>`;

  document.getElementById('fp-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn   = document.getElementById('fp-btn');
    const email = document.getElementById('fp-email').value.trim();
    hideAuthError();
    if (!email) { showAuthError('Please enter your email address.'); return; }

    btn.classList.add('btn-loading');
    btn.disabled = true;
    await delay(400);

    const token = Auth.requestPasswordReset(email);

    document.getElementById('fp-form').style.display = 'none';
    const succ = document.getElementById('fp-success');
    succ.style.display = 'flex';

    if (token) {
      const linkEl = document.getElementById('demo-reset-link');
      if (linkEl) {
        const resetUrl = `${window.location.origin}${window.location.pathname}#/reset-password/${token}`;
        linkEl.innerHTML = `<strong>Demo mode:</strong> Direct reset link:<br>
          <a href="#/reset-password/${token}" style="word-break:break-all;font-size:11px;color:var(--c-text-2)">${resetUrl}</a>`;
        linkEl.style.display = 'block';
      }
    }

    btn.classList.remove('btn-loading');
    btn.disabled = false;
  });
}

/* ---- Reset Password ---- */
function renderResetPassword(token, ctx) {
  const validation = Auth.validateResetToken(token);

  if (!validation.valid) {
    APP().innerHTML = `
      <div class="auth-shell">
        <div class="auth-card animate-fade-in" style="text-align:center">
          <div class="auth-logo" style="justify-content:center">
            <div class="auth-logo-mark">cr</div>
            <span class="auth-brand">[cred]</span>
          </div>
          <div style="margin:24px 0">${icon('alertTriangle', { size: 36 })}</div>
          <h1 class="auth-heading" style="font-size:20px">Link ${validation.reason === 'expired' ? 'expired' : 'invalid'}</h1>
          <p class="auth-subheading">${validation.reason === 'expired'
            ? 'This password reset link has expired. Reset links are valid for 1 hour.'
            : 'This reset link is invalid or has already been used.'}</p>
          <a href="#/forgot-password" class="btn btn-primary btn-lg" style="margin-top:16px;display:inline-flex">
            Request a new link
          </a>
        </div>
      </div>`;
    return;
  }

  APP().innerHTML = `
    <div class="auth-shell">
      <div class="auth-card animate-fade-in">
        <div class="auth-logo">
          <div class="auth-logo-mark">cr</div>
          <span class="auth-brand">[cred]</span>
        </div>
        <h1 class="auth-heading">Set new password</h1>
        <p class="auth-subheading">Choose a strong password for your account</p>

        <div id="auth-error" class="alert alert-error" style="display:none;margin-bottom:16px">
          <span class="alert-icon">${icon('x', { size: 16 })}</span><span id="auth-error-msg"></span>
        </div>

        <form id="rp-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="rp-pwd">New password <span class="required">*</span></label>
            <input class="form-input" id="rp-pwd" type="password" autocomplete="new-password"
              placeholder="At least 8 characters" required minlength="8">
          </div>
          <div class="form-group">
            <label class="form-label" for="rp-pwd2">Confirm new password <span class="required">*</span></label>
            <input class="form-input" id="rp-pwd2" type="password" autocomplete="new-password" placeholder="Repeat password" required>
          </div>
          <button type="submit" class="btn btn-primary btn-xl" id="rp-btn" style="width:100%">
            Save new password
          </button>
        </form>
      </div>
    </div>`;

  document.getElementById('rp-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn  = document.getElementById('rp-btn');
    const pwd  = document.getElementById('rp-pwd').value;
    const pwd2 = document.getElementById('rp-pwd2').value;
    hideAuthError();
    if (pwd.length < 8) { showAuthError('Password must be at least 8 characters.'); return; }
    if (pwd !== pwd2)   { showAuthError('Passwords do not match.'); return; }

    btn.classList.add('btn-loading');
    btn.disabled = true;
    try {
      await delay(200);
      Auth.resetPassword(token, pwd);
      ctx.showToast('Password updated. Please sign in with your new password.', 'success', 6000);
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
