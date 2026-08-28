/**
 * single-check.js — Real-time single-transaction manual check screen for [cred]
 * Features expanded 13-attribute parameters, MCC mapping, and design-system unified results.
 */

import { Batches } from '../store.js';
import { scoreTransaction, getRiskLevel } from '../ml.js';
import { icon } from '../icons.js';
import { sidebarHTML, headerHTML, mountSidebarToggle, mountLogout } from '../app.js';
import { generateForBatch } from '../notifications.js';
import { DATASET_PRESETS } from '../seed-data.js';

const APP = () => document.getElementById('app');

let _resultTx = null;
let _modelType = 'classical';

const MCC_MAP = {
  'Groceries': 5411,
  'Dining': 5812,
  'Gas & Fuel': 5541,
  'Online Retail': 5311,
  'Travel': 4111,
  'Entertainment': 7922,
  'Electronics': 5732,
  'Health': 8099,
  'Utilities': 4900,
};

export function renderSingleCheck(ctx) {
  const { user } = ctx;
  _resultTx  = null;
  _modelType = 'classical';

  APP().innerHTML = `
    <div class="app-shell">
      ${sidebarHTML(user, 'single-check')}
      <div class="main-content">
        ${headerHTML('Quick Single Check', null, user)}
        <main class="page-body animate-fade-in">

          <div class="single-check-grid">

            <!-- Expanded Form -->
            <div class="check-form-card">
              <div class="card-header">
                <div>
                  <div class="card-title">Transaction Parameters</div>
                  <div class="card-subtitle">Comprehensive 13-point risk inspection vector</div>
                </div>
              </div>

              <!-- Dataset Presets Quick Fill -->
              <div class="dataset-presets-box" style="margin-bottom:var(--sp-4);padding:var(--sp-3);background:var(--c-surface-2);border:1px solid var(--c-border);border-radius:var(--r-md)">
                <div style="font-size:11px;font-weight:700;color:var(--c-text-2);letter-spacing:0.04em;text-transform:uppercase;margin-bottom:var(--sp-2);display:flex;align-items:center;gap:6px;">
                  ${icon('database', { size: 13 })} Fill with Dataset Sample Case:
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  ${DATASET_PRESETS.map(p => `
                    <button type="button" class="btn btn-secondary btn-sm preset-btn" data-preset="${p.id}" style="font-size:11px;padding:4px 8px;">
                      ${p.name}
                    </button>
                  `).join('')}
                </div>
              </div>

              <div id="form-error" class="alert alert-error" style="display:none;margin-bottom:16px">
                <span class="alert-icon">${icon('alertTriangle', { size: 16 })}</span><span id="form-error-msg"></span>
              </div>

              <form id="check-form" novalidate>
                <!-- Row 1: Amount & Merchant -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="sc-amount">Amount (₹) <span class="required">*</span></label>
                    <input class="form-input mono" id="sc-amount" type="number" step="0.01" min="1" max="10000000"
                      placeholder="e.g. 4500.00" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="sc-merchant">Merchant Name <span class="required">*</span></label>
                    <input class="form-input" id="sc-merchant" type="text" placeholder="e.g. Flipkart / Croma" required>
                  </div>
                </div>

                <!-- Row 2: Category & Location -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="sc-category">Merchant Category <span class="required">*</span></label>
                    <select class="form-select" id="sc-category" required>
                      <option value="Groceries">Groceries & Supermarkets</option>
                      <option value="Dining">Dining & Food Delivery</option>
                      <option value="Gas & Fuel">Gas & Fuel Stations</option>
                      <option value="Online Retail" selected>Online Retail & E-Commerce</option>
                      <option value="Travel">Travel & Airlines</option>
                      <option value="Entertainment">Entertainment & Gaming</option>
                      <option value="Electronics">Electronics & Digital Goods</option>
                      <option value="Health">Health & Pharmacies</option>
                      <option value="Utilities">Utilities & Telecom</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="sc-location">Location / City <span class="required">*</span></label>
                    <input class="form-input" id="sc-location" type="text" placeholder="e.g. Mumbai, IN" value="Mumbai, IN" required>
                  </div>
                </div>

                <!-- Row 3: Card Type & Day of Week -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="sc-card">Payment Instrument <span class="required">*</span></label>
                    <select class="form-select" id="sc-card" required>
                      <option value="Visa">Visa (Credit/Debit)</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="RuPay" selected>RuPay Card / UPI 2.0</option>
                      <option value="Amex">American Express</option>
                      <option value="Discover">Discover</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="sc-day">Day of Week <span class="required">*</span></label>
                    <select class="form-select" id="sc-day" required>
                      <option value="Mon">Monday</option>
                      <option value="Tue">Tuesday</option>
                      <option value="Wed">Wednesday</option>
                      <option value="Thu">Thursday</option>
                      <option value="Fri">Friday</option>
                      <option value="Sat" selected>Saturday</option>
                      <option value="Sun">Sunday</option>
                    </select>
                  </div>
                </div>

                <!-- Row 4: Time of Day & Ratio to Median -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="sc-time">Time of Day <span class="required">*</span></label>
                    <select class="form-select" id="sc-time" required>
                      ${renderTimeOptions(14)}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="sc-ratio">Ratio to Median Amount</label>
                    <input class="form-input mono" id="sc-ratio" type="number" step="0.1" min="0.1" max="50"
                      placeholder="e.g. 1.2" value="1.2">
                    <span class="form-hint">1.0 = Average transaction value</span>
                  </div>
                </div>

                <!-- Row 5: Distances & Retry Attempts -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="sc-dist-home">Distance from Home (km)</label>
                    <input class="form-input mono" id="sc-dist-home" type="number" min="0" placeholder="e.g. 8.5" value="8.5">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="sc-dist-last">Distance from Last Tx (km)</label>
                    <input class="form-input mono" id="sc-dist-last" type="number" min="0" placeholder="e.g. 2.0" value="2.0">
                  </div>
                </div>

                <!-- Row 6: Retries -->
                <div class="form-group">
                  <label class="form-label" for="sc-retries">Prior Authentication Retries</label>
                  <input class="form-input mono" id="sc-retries" type="number" min="0" max="10" placeholder="0" value="0">
                  <span class="form-hint">Number of failed OTP/PIN attempts in last 15 minutes</span>
                </div>

                <!-- Toggles: International & Chip Auth -->
                <div style="border-top:1px solid var(--c-border);padding-top:var(--sp-3);margin-top:var(--sp-2)">
                  <div class="toggle-row">
                    <div class="toggle-info">
                      <div class="toggle-name">Cross-Border / International Transaction</div>
                      <div class="toggle-desc">Payment routed through overseas acquirer</div>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" id="sc-intl">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>

                  <div class="toggle-row">
                    <div class="toggle-info">
                      <div class="toggle-name">Chip / Dynamic 2FA Verified</div>
                      <div class="toggle-desc">Secured with EMV cryptogram or Verified by Visa / 3DS2</div>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" id="sc-chip" checked>
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <button type="submit" class="btn btn-primary btn-lg" id="check-btn" style="width:100%;margin-top:var(--sp-5)">
                  ${icon('zap', { size: 16 })} Execute Hybrid Fraud Analysis
                </button>
              </form>
            </div>

            <!-- Unified Result panel -->
            <div class="check-result-panel" id="result-panel">
              <div class="result-placeholder">
                <div class="empty-state-icon">${icon('shield', { size: 36 })}</div>
                <div style="font-weight:600;color:var(--c-text-1)">Awaiting Transaction Input</div>
                <div>Fill in the parameters and click <strong>Execute Hybrid Fraud Analysis</strong> to inspect classical and quantum risk scores.</div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>`;

  mountSidebarToggle();
  mountLogout(ctx);
  mountForm(ctx);
}

function renderTimeOptions(selectedHour = 14) {
  const options = [];
  for (let h = 0; h < 24; h++) {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const label = `${displayH}:00 ${period}`;
    const sel = h === selectedHour ? 'selected' : '';
    options.push(`<option value="${h}" ${sel}>${label}</option>`);
  }
  return options.join('');
}

function mountForm(ctx) {
  const { user } = ctx;

  // Handle dataset preset clicks
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetId = btn.dataset.preset;
      const preset = DATASET_PRESETS.find(p => p.id === presetId);
      if (!preset) return;
      const d = preset.data;

      document.getElementById('sc-amount').value = d.amount;
      document.getElementById('sc-merchant').value = d.merchant;
      document.getElementById('sc-location').value = d.is_international ? `${d.country} Overseas Acquirer` : 'Mumbai, IN';
      document.getElementById('sc-card').value = d.card_type.includes('RuPay') ? 'RuPay' : d.card_type.includes('Mastercard') ? 'Mastercard' : d.card_type.includes('Amex') ? 'Amex' : 'Visa';
      document.getElementById('sc-time').value = d.hour;
      document.getElementById('sc-ratio').value = d.ratio_to_median;
      document.getElementById('sc-dist-home').value = d.distance_from_home;
      document.getElementById('sc-dist-last').value = d.distance_from_last_tx;
      document.getElementById('sc-retries').value = d.retry_attempts;
      document.getElementById('sc-intl').checked = d.is_international;
      document.getElementById('sc-chip').checked = d.chip_authenticated;

      // Category matching
      if (d.mcc === 5944 || d.mcc === 5732) {
        document.getElementById('sc-category').value = 'Electronics';
      } else if (d.mcc === 5411) {
        document.getElementById('sc-category').value = 'Groceries';
      } else if (d.mcc === 5812) {
        document.getElementById('sc-category').value = 'Dining';
      } else {
        document.getElementById('sc-category').value = 'Online Retail';
      }

      // Auto-trigger evaluation
      document.getElementById('check-form').dispatchEvent(new Event('submit', { cancelable: true }));
    });
  });

  document.getElementById('check-form').addEventListener('submit', async e => {
    e.preventDefault();
    hideError();

    const amount   = parseFloat(document.getElementById('sc-amount').value);
    const merchant = document.getElementById('sc-merchant').value.trim();
    const category = document.getElementById('sc-category').value;
    const location = document.getElementById('sc-location').value.trim();
    const card     = document.getElementById('sc-card').value;
    const day      = document.getElementById('sc-day').value;
    const hour     = parseInt(document.getElementById('sc-time').value, 10);
    const ratio    = parseFloat(document.getElementById('sc-ratio').value) || 1.0;
    const distHome = parseFloat(document.getElementById('sc-dist-home').value) || 0;
    const distLast = parseFloat(document.getElementById('sc-dist-last').value) || 0;
    const retries  = parseInt(document.getElementById('sc-retries').value, 10) || 0;
    const isIntl   = document.getElementById('sc-intl').checked;
    const chipAuth = document.getElementById('sc-chip').checked;

    const errs = [];
    if (isNaN(amount) || amount <= 0 || amount > 10000000) errs.push('Amount must be a positive number ≤ ₹1,00,00,000.');
    if (!merchant) errs.push('Merchant name is required.');
    if (!location) errs.push('Location is required.');
    if (isNaN(hour) || hour < 0 || hour > 23) errs.push('Valid time of day is required.');

    if (errs.length) { showError(errs[0]); return; }

    const btn = document.getElementById('check-btn');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    await new Promise(r => setTimeout(r, 200));

    const mcc = MCC_MAP[category] || 5411;
    const country = isIntl ? 'US' : 'IN';

    const rawTx = {
      amount,
      merchant,
      mcc,
      category,
      country,
      location,
      card_type: card,
      day_of_week: day,
      hour,
      distance_from_home: distHome,
      distance_from_last_tx: distLast,
      ratio_to_median: ratio,
      retry_attempts: retries,
      is_international: isIntl,
      chip_authenticated: chipAuth,
      date: new Date().toISOString().split('T')[0],
    };

    const scoredTx = scoreTransaction(rawTx);
    _resultTx  = scoredTx;
    _modelType = 'classical';

    const batch = Batches.create(user.id, {
      type: 'single',
      fileName: null,
      transactions: [scoredTx],
      modelUsed: 'classical',
    });

    generateForBatch(user.id, batch.id, [scoredTx], user.notificationPrefs);

    btn.classList.remove('btn-loading');
    btn.disabled = false;

    renderResult(scoredTx, ctx);
  });
}

function renderResult(tx, ctx) {
  const panel = document.getElementById('result-panel');
  if (!panel) return;
  panel.innerHTML = buildResultHTML(tx, _modelType);
  animateFeatureBars();
  mountResultControls(tx, ctx);
}

function buildResultHTML(tx, model) {
  const r = tx[model] || tx.classical;
  if (!r) return '';
  const level = getRiskLevel(r.score);
  const pct   = Math.round(r.score * 100);

  return `
    <!-- Top Model Toggle & Score Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-2)">
      <div style="font-size:var(--text-xs);font-weight:600;color:var(--c-text-3);text-transform:uppercase;letter-spacing:.05em">
        Triage Assessment
      </div>
      <div class="model-toggle" role="group" aria-label="Switch model">
        <button class="model-toggle-btn${model === 'classical' ? ' active' : ''}" id="res-classical">Classical (XGBoost)</button>
        <button class="model-toggle-btn quantum${model === 'quantum' ? ' active' : ''}" id="res-quantum">Quantum (VQC)</button>
      </div>
    </div>

    <!-- Reusing Design System .score-display -->
    <div class="score-display">
      ${scoreGaugeHTML(pct, level)}
      <div class="score-info-col">
        <div class="score-number" style="color:${levelColor(level)}">${pct}%</div>
        <div class="score-verdict">
          ${r.flag ? `${icon('alertTriangle', { size: 16 })} Flagged as High Risk Fraud` : `${icon('check', { size: 16 })} Cleared / Low Risk`}
        </div>
        <div class="score-model-tag">
          <span class="badge ${model === 'quantum' ? 'badge-quantum' : 'badge-classical'}">
            ${model === 'quantum' ? 'Quantum Kernel' : 'Classical Tree'}
          </span>
          fraud probability estimation
        </div>
      </div>
    </div>

    <!-- Decision Rationale -->
    <div style="padding:14px 0;border-bottom:1px solid var(--c-border)">
      <div class="card-title" style="font-size:14px;margin-bottom:8px">Decision Rationale</div>
      <p class="explanation-text ${level}">${r.explanation}</p>
    </div>

    <!-- Contributing Features -->
    <div style="padding:14px 0;border-bottom:1px solid var(--c-border)">
      <div class="card-title" style="font-size:14px">Top Contributing Risk Features</div>
      <div class="card-subtitle" style="margin-bottom:12px">
        ↑ Elevated risk driver &nbsp;·&nbsp; ↓ Risk mitigating security factor
      </div>
      <div class="feature-list" id="sc-feature-list">
        ${r.features.map((f, i) => `
          <div class="feature-item">
            <div class="feature-name">${esc(f.label)}</div>
            <div class="feature-bar-wrap">
              <div class="feature-bar ${f.direction}" style="width:0%" data-target="${Math.round(f.magnitude * 100)}%" id="scfb-${i}"></div>
            </div>
            <div class="feature-dir ${f.direction}">
              ${f.direction === 'up' ? `${icon('arrowUp', { size: 11 })} Risk` : `${icon('arrowDown', { size: 11 })} Safe`}
            </div>
          </div>
          <div style="font-size:11px;color:var(--c-text-3);margin-top:-6px;margin-bottom:6px;line-height:1.4">
            ${esc(f.explanation)}
          </div>`).join('')}
      </div>
    </div>

    <!-- Action Toolbar -->
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <a href="#/transaction/${tx.id}" class="btn btn-secondary">
        Drill Down Detail ${icon('arrowRight', { size: 14 })}
      </a>
      <button class="btn btn-ghost" id="sc-export-btn">
        ${icon('download', { size: 14 })} Export Record
      </button>
    </div>`;
}

function mountResultControls(tx, ctx) {
  document.getElementById('res-classical')?.addEventListener('click', () => {
    _modelType = 'classical';
    renderResult(tx, ctx);
  });
  document.getElementById('res-quantum')?.addEventListener('click', () => {
    _modelType = 'quantum';
    renderResult(tx, ctx);
  });
  document.getElementById('sc-export-btn')?.addEventListener('click', () => {
    doExport(tx, ctx.user);
  });
}

function doExport(tx, user) {
  window.showModal(`
    <h2 class="modal-title">Export Single Transaction</h2>
    <p class="modal-body">Download full fraud attribution report for ${esc(tx.merchant)}.</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="m-cancel">Cancel</button>
      <button class="btn btn-primary" id="m-csv">${icon('download', { size: 14 })} CSV</button>
      <button class="btn btn-primary" id="m-pdf">${icon('download', { size: 14 })} PDF Report</button>
    </div>`, modal => {
    import('../export.js').then(({ exportToCSV, exportToPDF }) => {
      modal.querySelector('#m-cancel').addEventListener('click', window.closeModal);
      modal.querySelector('#m-csv').addEventListener('click', () => {
        try { exportToCSV([tx], `cred_check_${tx.id}`, _modelType); window.closeModal(); window.showToast('CSV downloaded.', 'success'); }
        catch(e) { window.showToast(e.message, 'error'); }
      });
      modal.querySelector('#m-pdf').addEventListener('click', () => {
        try {
          exportToPDF([tx], `cred_check_${tx.id}`, { userName: user?.name, batchName: 'Single Triage Check', modelType: _modelType, exportedAt: new Date().toISOString() });
          window.closeModal(); window.showToast('PDF downloaded.', 'success');
        } catch(e) { window.showToast(e.message, 'error'); }
      });
    });
  });
}

function animateFeatureBars() {
  requestAnimationFrame(() => {
    document.querySelectorAll('.feature-bar[data-target]').forEach(bar => {
      setTimeout(() => { bar.style.width = bar.dataset.target; }, 60);
    });
  });
}

function scoreGaugeHTML(pct, level) {
  const r = 34; const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = levelColor(level);
  return `
    <div class="score-gauge" aria-label="Score: ${pct}%">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle class="score-gauge-bg" cx="40" cy="40" r="${r}" stroke-width="6" fill="none"/>
        <circle class="score-gauge-fill" cx="40" cy="40" r="${r}" stroke-width="6" fill="none"
          stroke="${color}"
          stroke-dasharray="${circ}"
          stroke-dashoffset="${offset}"/>
      </svg>
      <div class="score-gauge-text" style="color:${color}">${pct}%</div>
    </div>`;
}

function showError(msg) {
  const el = document.getElementById('form-error');
  const msg2 = document.getElementById('form-error-msg');
  if (el && msg2) { msg2.textContent = msg; el.style.display = 'flex'; }
}
function hideError() {
  const el = document.getElementById('form-error');
  if (el) el.style.display = 'none';
}
function levelColor(level) {
  if (level === 'high') return 'var(--c-high)';
  if (level === 'medium') return 'var(--c-medium)';
  return 'var(--c-low)';
}
function esc(s) { return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
