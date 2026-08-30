/**
 * single-check.js — Real-Time Single Transaction Investigation Terminal for cred ai
 * Features 13-point risk parameter inspection, dataset presets, and explainable AI attribution.
 */

import { Batches } from '../store.js';
import { scoreTransaction, getRiskLevel } from '../ml.js';
import { exportToCSV, exportToPDF } from '../export.js';
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
        ${headerHTML('Quick Transaction Check', null, user)}
        <main class="page-body animate-fade-in">

          <div class="single-check-workspace">

            <!-- Left: 13-Point Parameter Form -->
            <div class="check-form-panel">
              <div style="margin-bottom:var(--sp-4)">
                <div style="font-size:15px;font-weight:700;color:var(--c-text-1)">Transaction Parameters</div>
                <div style="font-size:11px;color:var(--c-text-3)">Submit payment attributes to the ML & Quantum hybrid triage pipeline</div>
              </div>

              <!-- Quick Presets -->
              <div style="margin-bottom:var(--sp-4);padding:var(--sp-3);background:var(--c-surface-2);border:1px solid var(--c-border);border-radius:var(--r-md)">
                <div style="font-size:10px;font-weight:700;color:var(--c-text-2);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;display:flex;align-items:center;gap:4px">
                  ${icon('database', { size: 12 })} Test Scenario Presets:
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:5px">
                  ${DATASET_PRESETS.map(p => `
                    <button type="button" class="btn btn-secondary btn-sm preset-btn" data-preset="${p.id}" style="font-size:11px;padding:3px 8px">
                      ${p.name}
                    </button>
                  `).join('')}
                </div>
              </div>

              <div id="form-error" class="alert alert-error" style="display:none;margin-bottom:14px">
                <span class="alert-icon">${icon('alertTriangle', { size: 14 })}</span><span id="form-error-msg"></span>
              </div>

              <form id="check-form" novalidate>
                <!-- Row 1: Amount & Merchant -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="sc-amount">Settlement (₹) <span class="required">*</span></label>
                    <input class="form-input mono" id="sc-amount" type="number" step="0.01" min="1" max="10000000"
                      placeholder="e.g. 4500.00" value="4500.00" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="sc-merchant">Merchant Entity <span class="required">*</span></label>
                    <input class="form-input" id="sc-merchant" type="text" placeholder="e.g. Flipkart / Croma" value="Flipkart Online" required>
                  </div>
                </div>

                <!-- Row 2: Category & Location -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="sc-category">Merchant Category <span class="required">*</span></label>
                    <select class="form-select" id="sc-category" required>
                      <option value="Groceries">Groceries & Supermarkets</option>
                      <option value="Dining">Dining & Delivery</option>
                      <option value="Gas & Fuel">Gas & Fuel Stations</option>
                      <option value="Online Retail" selected>Online Retail & E-Commerce</option>
                      <option value="Travel">Travel & Airlines</option>
                      <option value="Entertainment">Entertainment & Gaming</option>
                      <option value="Electronics">Electronics & Digital</option>
                      <option value="Health">Health & Pharmacies</option>
                      <option value="Utilities">Utilities & Telecom</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="sc-location">Geographic Origin <span class="required">*</span></label>
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
                      <option value="RuPay" selected>RuPay Card / UPI</option>
                      <option value="Amex">American Express</option>
                      <option value="Discover">Discover</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="sc-day">Transaction Day <span class="required">*</span></label>
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

                <!-- Row 4: Hour & Ratio -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="sc-time">Hour of Day <span class="required">*</span></label>
                    <select class="form-select mono" id="sc-time" required>
                      ${renderTimeOptions(14)}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="sc-ratio">Ratio to User Median</label>
                    <input class="form-input mono" id="sc-ratio" type="number" step="0.1" min="0.1" max="50" value="1.2">
                  </div>
                </div>

                <!-- Row 5: Distances -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="sc-dist-home">Distance from Home (km)</label>
                    <input class="form-input mono" id="sc-dist-home" type="number" min="0" value="8.5">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="sc-dist-last">Distance from Last Tx (km)</label>
                    <input class="form-input mono" id="sc-dist-last" type="number" min="0" value="2.0">
                  </div>
                </div>

                <!-- Row 6: Retries & Security Toggles -->
                <div class="form-group">
                  <label class="form-label" for="sc-retries">Failed 2FA / OTP Retries (Last 15m)</label>
                  <input class="form-input mono" id="sc-retries" type="number" min="0" max="10" value="0">
                </div>

                <div style="border-top:1px solid var(--c-border);padding-top:var(--sp-2);margin-top:var(--sp-2)">
                  <div class="toggle-row">
                    <div class="toggle-info">
                      <div class="toggle-name">Cross-Border / Overseas Acquirer</div>
                      <div class="toggle-desc">Payment routed through non-domestic gateway</div>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" id="sc-intl">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>

                  <div class="toggle-row">
                    <div class="toggle-info">
                      <div class="toggle-name">EMV Dynamic 3DS2 / Cryptogram</div>
                      <div class="toggle-desc">Cryptographically authenticated chip or 2FA session</div>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" id="sc-chip" checked>
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <button type="submit" class="btn btn-primary btn-lg" id="check-btn" style="width:100%;margin-top:var(--sp-4)">
                  ${icon('zap', { size: 15 })} Execute Hybrid Triage Analysis
                </button>
              </form>
            </div>

            <!-- Right: Real-time Result Terminal -->
            <div class="check-result-panel" id="result-panel">
              <div class="empty-state" style="margin:auto 0">
                <div class="empty-state-icon">${icon('shield', { size: 36 })}</div>
                <div class="empty-state-title">Awaiting Transaction Parameters</div>
                <div class="empty-state-desc">
                  Select a test scenario preset or fill in the parameters and click <strong>Execute Hybrid Triage Analysis</strong>.
                </div>
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

  // Preset quick fill
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetId = btn.dataset.preset;
      const preset = DATASET_PRESETS.find(p => p.id === presetId);
      if (!preset) return;
      const d = preset.data;

      document.getElementById('sc-amount').value = d.amount;
      document.getElementById('sc-merchant').value = d.merchant;
      document.getElementById('sc-location').value = d.is_international ? `${d.country} Overseas Gateway` : 'Mumbai, IN';
      document.getElementById('sc-card').value = d.card_type.includes('RuPay') ? 'RuPay' : d.card_type.includes('Mastercard') ? 'Mastercard' : d.card_type.includes('Amex') ? 'Amex' : 'Visa';
      document.getElementById('sc-time').value = d.hour;
      document.getElementById('sc-ratio').value = d.ratio_to_median;
      document.getElementById('sc-dist-home').value = d.distance_from_home;
      document.getElementById('sc-dist-last').value = d.distance_from_last_tx;
      document.getElementById('sc-retries').value = d.retry_attempts;
      document.getElementById('sc-intl').checked = d.is_international;
      document.getElementById('sc-chip').checked = d.chip_authenticated;

      if (d.mcc === 5944 || d.mcc === 5732) {
        document.getElementById('sc-category').value = 'Electronics';
      } else if (d.mcc === 5411) {
        document.getElementById('sc-category').value = 'Groceries';
      } else if (d.mcc === 5812) {
        document.getElementById('sc-category').value = 'Dining';
      } else {
        document.getElementById('sc-category').value = 'Online Retail';
      }

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
    if (isNaN(amount) || amount <= 0) errs.push('Amount must be greater than ₹0.');
    if (!merchant) errs.push('Merchant name is required.');
    if (!location) errs.push('Location is required.');

    if (errs.length) { showError(errs[0]); return; }

    const btn = document.getElementById('check-btn');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    await new Promise(r => setTimeout(r, 180));

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

  const riskLabel = level === 'high' ? 'High Risk' : level === 'medium' ? 'Medium Risk' : 'Low Risk';
  const riskColor = level === 'high' ? 'var(--c-high)' : level === 'medium' ? 'var(--c-medium)' : 'var(--c-low)';

  let nextActionTitle = 'Approve & Settle Payment';
  let nextActionDesc = 'Transaction telemetry is consistent with legitimate customer profile. Safe for instant clearing.';
  let nextActionIcon = 'check';

  if (level === 'high') {
    nextActionTitle = 'Intercept & Require Biometric / Step-Up Auth';
    nextActionDesc = 'High probability of malicious fraud vector. Payment blocked pending immediate cardholder confirmation.';
    nextActionIcon = 'alertTriangle';
  } else if (level === 'medium') {
    nextActionTitle = 'Hold for Secondary 2FA Verification (3DS2)';
    nextActionDesc = 'Elevated transaction discrepancy. Require SMS OTP challenge before settlement.';
    nextActionIcon = 'info';
  }

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-4)">
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--c-text-3);text-transform:uppercase;letter-spacing:.05em">
          cred ai Triage Result
        </div>
        <div style="font-size:15px;font-weight:700;color:var(--c-text-1)">
          ${esc(tx.merchant)} · ₹${Number(tx.amount || 0).toLocaleString('en-IN')}
        </div>
      </div>
      <div class="model-toggle" role="group" aria-label="Select evaluation model">
        <button class="model-toggle-btn${model === 'classical' ? ' active' : ''}" id="res-classical">Classical XGBoost</button>
        <button class="model-toggle-btn quantum${model === 'quantum' ? ' active' : ''}" id="res-quantum">Quantum VQC</button>
      </div>
    </div>

    <!-- 1. Probability Callout & Verdict Banner -->
    <div style="padding:var(--sp-4);background:var(--c-surface-2);border:1px solid var(--c-border);border-radius:var(--r-lg);display:flex;align-items:center;gap:var(--sp-4);margin-bottom:var(--sp-4)">
      <div style="font-family:var(--font-mono);font-size:36px;font-weight:800;color:${riskColor};line-height:1;min-width:90px;font-variant-numeric:tabular-nums">
        ${pct}%
      </div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          <span class="risk-indicator ${level}" style="font-weight:700">
            <span class="risk-dot"></span>${riskLabel}
          </span>
          <span class="badge ${model === 'quantum' ? 'badge-quantum' : 'badge-classical'}" style="font-size:10px">
            ${model === 'quantum' ? 'Quantum Kernel' : 'Decision Tree'}
          </span>
        </div>
        <div style="font-size:12px;color:var(--c-text-2)">
          ${r.flag ? '<strong>Flagged:</strong> High probability of fraudulent behavior.' : '<strong>Cleared:</strong> Normal transaction behavior.'}
        </div>
      </div>
    </div>

    <!-- 2. Action Recommendation -->
    <div style="padding:var(--sp-3-5) var(--sp-4);background:${level === 'high' ? 'rgba(239, 68, 68, 0.08)' : level === 'medium' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)'};border:1px solid ${level === 'high' ? 'rgba(239, 68, 68, 0.22)' : level === 'medium' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(16, 185, 129, 0.22)'};border-radius:var(--r-md);margin-bottom:var(--sp-4)">
      <div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:12px;color:${riskColor}">
        ${icon(nextActionIcon, { size: 14 })} ${nextActionTitle}
      </div>
      <div style="font-size:11px;color:var(--c-text-2);margin-top:3px;line-height:1.4">
        ${nextActionDesc}
      </div>
    </div>

    <!-- 3. Rationale -->
    <div style="margin-bottom:var(--sp-4)">
      <div style="font-size:11px;font-weight:700;color:var(--c-text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px">
        Explainable Decision Rationale
      </div>
      <p class="explanation-text ${level}" style="margin:0;font-size:12px;line-height:1.5">
        ${r.explanation}
      </p>
    </div>

    <!-- 4. Contributing Factors (SHAP-inspired) -->
    <div style="flex:1;margin-bottom:var(--sp-4)">
      <div style="font-size:11px;font-weight:700;color:var(--c-text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px">
        Feature Attribution Breakdown
      </div>
      <div class="feature-list" id="sc-feature-list">
        ${r.features.map((f, i) => `
          <div class="feature-item">
            <div class="feature-name">${esc(f.label)}</div>
            <div class="feature-bar-wrap">
              <div class="feature-bar ${f.direction}" style="width:0%" data-target="${Math.round(f.magnitude * 100)}%" id="scfb-${i}"></div>
            </div>
            <div class="feature-dir ${f.direction}">
              ${f.direction === 'up' ? '↑ Risk' : '↓ Safe'}
            </div>
          </div>
          <div style="font-size:10px;color:var(--c-text-3);margin-top:-3px;margin-bottom:6px;line-height:1.3">
            ${esc(f.explanation)}
          </div>`).join('')}
      </div>
    </div>

    <!-- Action Buttons -->
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px solid var(--c-border);padding-top:var(--sp-4)">
      <a href="#/transaction/${tx.id}" class="btn btn-secondary btn-sm">
        Full Dossier ${icon('chevronRight', { size: 11 })}
      </a>
      <button class="btn btn-ghost btn-sm" id="sc-export-btn">
        ${icon('download', { size: 12 })} Export Report
      </button>
      <button class="btn btn-ghost btn-sm" id="sc-reset-btn" style="margin-left:auto">
        Check Another
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
  document.getElementById('sc-reset-btn')?.addEventListener('click', () => {
    document.getElementById('sc-amount')?.focus();
    document.getElementById('sc-amount')?.select();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function doExport(tx, user) {
  window.showModal(`
    <h2 class="modal-title">Export Investigation Packet</h2>
    <p class="modal-body">Download comprehensive forensic fraud attribution report for ${esc(tx.merchant)}.</p>
    <div class="modal-actions">
      <button class="btn btn-secondary btn-sm" id="m-cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" id="m-csv">${icon('download', { size: 12 })} Export CSV</button>
      <button class="btn btn-primary btn-sm" id="m-pdf">${icon('download', { size: 12 })} Export PDF Dossier</button>
    </div>`, modal => {
    modal.querySelector('#m-cancel').addEventListener('click', window.closeModal);
    modal.querySelector('#m-csv').addEventListener('click', () => {
      try {
        exportToCSV([tx], `cred_ai_check_${tx.id}`, _modelType);
        window.closeModal();
        window.showToast('CSV report downloaded.', 'success');
      } catch(e) { window.showToast(e.message, 'error'); }
    });
    modal.querySelector('#m-pdf').addEventListener('click', () => {
      try {
        exportToPDF([tx], `cred_ai_dossier_${tx.id}`, {
          userName: user?.name,
          batchName: 'Single Investigation Packet',
          modelType: _modelType,
          exportedAt: new Date().toISOString(),
        });
        window.closeModal();
        window.showToast('PDF dossier generated.', 'success');
      } catch(e) { window.showToast(e.message, 'error'); }
    });
  });
}

function animateFeatureBars() {
  requestAnimationFrame(() => {
    document.querySelectorAll('.feature-bar[data-target]').forEach(bar => {
      setTimeout(() => { bar.style.width = bar.dataset.target; }, 50);
    });
  });
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
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
