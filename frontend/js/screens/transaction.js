/**
 * transaction.js — Transaction detail view with Classical vs Quantum comparison for [cred]
 */

import { Batches, AppMeta } from '../store.js';
import { getRiskLevel } from '../ml.js';
import { exportToCSV, exportToPDF } from '../export.js';
import { icon } from '../icons.js';
import { sidebarHTML, headerHTML, mountSidebarToggle, mountLogout } from '../app.js';

const APP = () => document.getElementById('app');

let _activeModel = 'classical';

export function renderTransaction(txId, ctx) {
  const { user } = ctx;
  const found = Batches.getTransaction(user.id, txId);

  if (!found) {
    APP().innerHTML = `
      <div class="app-shell">
        ${sidebarHTML(user, 'dashboard')}
        <div class="main-content">
          ${headerHTML(null, `<a href="#/dashboard">Dashboard</a><span class="breadcrumb-sep">${icon('chevronRight', { size: 12 })}</span>Transaction`, user)}
          <main class="page-body">
            <div class="empty-state">
              <div class="empty-state-icon">${icon('search', { size: 36 })}</div>
              <div class="empty-state-title">Transaction not found</div>
              <div class="empty-state-desc">This transaction may have been deleted or doesn't belong to your account.</div>
              <button class="btn btn-primary" style="margin-top:16px" onclick="navigate('/dashboard')">Back to Dashboard</button>
            </div>
          </main>
        </div>
      </div>`;
    mountSidebarToggle();
    mountLogout(ctx);
    return;
  }

  const { transaction: tx, batch } = found;
  _activeModel = 'classical';

  const batchPath = batch ? `/history/${batch.id}` : '/history';
  const batchName = batch?.fileName || (batch?.type === 'single' ? 'Single Check' : 'Batch');

  APP().innerHTML = `
    <div class="app-shell">
      ${sidebarHTML(user, 'dashboard')}
      <div class="main-content">
        ${headerHTML(null, `
          <a href="#/dashboard">Dashboard</a>
          <span class="breadcrumb-sep">${icon('chevronRight', { size: 12 })}</span>
          <a href="#${batchPath}">${esc(batchName)}</a>
          <span class="breadcrumb-sep">${icon('chevronRight', { size: 12 })}</span>
          <span style="color:var(--c-text-1)">${esc(tx.merchant || 'Transaction')}</span>
        `, user)}
        <main class="page-body animate-fade-in">

          <!-- Model tabs -->
          <div class="tab-list" role="tablist" aria-label="Model results">
            <button class="tab-btn active" id="tab-classical" role="tab" aria-selected="true" data-model="classical">
              ${icon('shield', { size: 15 })} Classical (XGBoost)
            </button>
            <button class="tab-btn" id="tab-quantum" role="tab" aria-selected="false" data-model="quantum">
              ${icon('zap', { size: 15 })} Quantum (VQC/QSVM)
            </button>
            <button class="tab-btn" id="tab-compare" role="tab" aria-selected="false" data-model="compare">
              ${icon('scale', { size: 15 })} Compare Models
            </button>
          </div>

          <div class="tx-detail-grid">

            <!-- Left: Transaction metadata -->
            <aside>
              <div class="tx-meta-card">
                <div class="tx-meta-header">
                  <div class="tx-merchant">${esc(tx.merchant || 'Unknown Merchant')}</div>
                  <div class="tx-amount">₹${Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="tx-meta-body">
                  ${metaRow('Date',         tx.date || '—')}
                  ${metaRow('Country',      tx.country || 'IN')}
                  ${metaRow('Payment Type', tx.card_type || 'Visa')}
                  ${metaRow('Category / MCC', tx.mcc ? `${tx.mcc}` : '—')}
                  ${metaRow('Hour of Day',  tx.hour !== undefined ? `${tx.hour}:00` : '—')}
                  ${metaRow('Distance from Home', tx.distance_from_home !== undefined ? `${tx.distance_from_home} km` : '—')}
                  ${tx.distance_from_last_tx ? metaRow('Distance from Last Tx', `${tx.distance_from_last_tx} km`) : ''}
                  ${tx.retry_attempts ? metaRow('Failed Retries', `${tx.retry_attempts}`) : ''}
                  ${metaRow('Transaction ID', `<span class="mono" style="font-size:11px">${esc(tx.id)}</span>`, true)}
                </div>
              </div>

              <!-- Adaptive learning indicator -->
              <div class="adaptive-indicator" style="margin-top:12px" title="Last time model weights were calibrated">
                <span class="adaptive-dot"></span>
                Model active (${formatDate(AppMeta.getModelLastUpdated())})
              </div>

              <!-- Export button -->
              <div style="margin-top:12px">
                <button class="btn btn-secondary" style="width:100%" id="export-tx-btn">
                  ${icon('download', { size: 14 })} Export Record
                </button>
              </div>
            </aside>

            <!-- Right: Analysis panel -->
            <div class="tx-analysis-panel" id="analysis-panel">
              ${renderAnalysisPanel(tx, _activeModel)}
            </div>
          </div>

        </main>
      </div>
    </div>`;

  mountSidebarToggle();
  mountLogout(ctx);
  mountTabs(tx, ctx);
  animateFeatureBars();

  document.getElementById('export-tx-btn')?.addEventListener('click', () => {
    doExportSingle(tx, user);
  });
}

function renderAnalysisPanel(tx, modelOrCompare) {
  if (modelOrCompare === 'compare') {
    return renderCompare(tx);
  }
  const r = tx[modelOrCompare] || tx.classical;
  if (!r) return '<div class="empty-state"><div class="empty-state-title">No results available</div></div>';
  const level = getRiskLevel(r.score);
  const pct   = Math.round(r.score * 100);

  return `
    <!-- Score -->
    <div class="score-display">
      ${scoreGaugeHTML(pct, level)}
      <div class="score-info-col">
        <div class="score-number" style="color:${levelColor(level)}">${pct}%</div>
        <div class="score-verdict">
          ${r.flag ? `${icon('alertTriangle', { size: 16 })} Flagged as High Risk Fraud` : `${icon('check', { size: 16 })} Normal / Cleared`}
        </div>
        <div class="score-model-tag">
          <span class="badge ${modelOrCompare === 'quantum' ? 'badge-quantum' : 'badge-classical'}">
            ${modelOrCompare === 'quantum' ? 'Quantum VQC' : 'Classical XGBoost'}
          </span>
          fraud probability estimation
        </div>
      </div>
    </div>

    <!-- Explanation -->
    <div class="card" style="padding:0">
      <div style="padding:16px 20px;border-bottom:1px solid var(--c-border)">
        <div class="card-title" style="font-size:14px">Decision Rationale</div>
      </div>
      <div style="padding:16px 20px">
        <p class="explanation-text ${level}">${r.explanation}</p>
      </div>
    </div>

    <!-- Feature breakdown -->
    <div class="card" style="padding:0">
      <div style="padding:16px 20px;border-bottom:1px solid var(--c-border)">
        <div class="card-title" style="font-size:14px">Top Contributing Risk Features</div>
        <div class="card-subtitle">
          ↑ Increases fraud likelihood &nbsp;·&nbsp; ↓ Decreases fraud likelihood
        </div>
      </div>
      <div style="padding:16px 20px">
        <div class="feature-list" id="feature-list-${modelOrCompare}">
          ${r.features.map((f, i) => `
            <div class="feature-item">
              <div class="feature-name">${esc(f.label)}</div>
              <div class="feature-bar-wrap">
                <div class="feature-bar ${f.direction}"
                  style="width:0%"
                  data-target="${Math.round(f.magnitude * 100)}%"
                  id="fb-${modelOrCompare}-${i}"></div>
              </div>
              <div class="feature-dir ${f.direction}">
                ${f.direction === 'up' ? `${icon('arrowUp', { size: 11 })} Risk` : `${icon('arrowDown', { size: 11 })} Safe`}
              </div>
            </div>
            <div style="font-size:12px;color:var(--c-text-3);margin-top:-6px;margin-bottom:6px;line-height:1.4">
              ${esc(f.explanation)}
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}

function renderCompare(tx) {
  const c = tx.classical;
  const q = tx.quantum;
  if (!c || !q) return '<div class="empty-state"><div class="empty-state-title">Comparison unavailable</div></div>';

  const cLevel = getRiskLevel(c.score);
  const qLevel = getRiskLevel(q.score);
  const cPct   = Math.round(c.score * 100);
  const qPct   = Math.round(q.score * 100);
  const diff   = Math.abs(cPct - qPct);
  const agree  = c.flag === q.flag;

  return `
    <div class="alert alert-info" style="margin-bottom:0">
      <span class="alert-icon">${icon('info', { size: 16 })}</span>
      <span>Both engines scored this transaction.
        ${agree ? 'They <strong>agree</strong> on the risk verdict.' : `They <strong>diverge</strong> — the models captured different correlation patterns.`}
        Difference: <strong>${diff} percentage points</strong>.
      </span>
    </div>

    <div class="compare-grid">
      <!-- Classical -->
      <div class="compare-col">
        <div class="compare-col-header">
          <span class="badge badge-classical">Classical</span>
          <span class="compare-model-label">XGBoost Decision Trees</span>
        </div>
        <div style="margin-bottom:16px">
          ${scoreGaugeHTML(cPct, cLevel)}
        </div>
        <div style="font-size:22px;font-weight:700;color:${levelColor(cLevel)};margin-bottom:4px">${cPct}%</div>
        <div style="font-size:13px;margin-bottom:12px">${c.flag ? `<span class="badge badge-high">${icon('alertTriangle', { size: 11 })} Flagged</span>` : `<span class="badge badge-low">${icon('check', { size: 11 })} Safe</span>`}</div>
        <p class="explanation-text ${cLevel}" style="font-size:13px">${c.explanation}</p>
      </div>

      <!-- Quantum -->
      <div class="compare-col">
        <div class="compare-col-header">
          <span class="badge badge-quantum">Quantum</span>
          <span class="compare-model-label">VQC / QSVM Hilbert Kernel</span>
        </div>
        <div style="margin-bottom:16px">
          ${scoreGaugeHTML(qPct, qLevel)}
        </div>
        <div style="font-size:22px;font-weight:700;color:${levelColor(qLevel)};margin-bottom:4px">${qPct}%</div>
        <div style="font-size:13px;margin-bottom:12px">${q.flag ? `<span class="badge badge-high">${icon('alertTriangle', { size: 11 })} Flagged</span>` : `<span class="badge badge-low">${icon('check', { size: 11 })} Safe</span>`}</div>
        <p class="explanation-text ${qLevel}" style="font-size:13px">${q.explanation}</p>
      </div>
    </div>`;
}

function mountTabs(tx, ctx) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      const model = btn.dataset.model;
      _activeModel = model;
      const panel = document.getElementById('analysis-panel');
      if (panel) {
        panel.innerHTML = renderAnalysisPanel(tx, model);
        animateFeatureBars();
      }
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

function levelColor(level) {
  if (level === 'high')   return 'var(--c-high)';
  if (level === 'medium') return 'var(--c-medium)';
  return 'var(--c-low)';
}

function metaRow(label, value, raw = false) {
  return `
    <div class="tx-meta-row">
      <span class="tx-meta-key">${label}</span>
      <span class="tx-meta-val">${raw ? value : esc(String(value))}</span>
    </div>`;
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return iso; }
}

function doExportSingle(tx, user) {
  window.showModal(`
    <h2 class="modal-title">Export Transaction</h2>
    <p class="modal-body">Export full triage audit report for ${esc(tx.merchant)}.</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-csv">${icon('download', { size: 14 })} CSV</button>
      <button class="btn btn-primary" id="modal-pdf">${icon('download', { size: 14 })} PDF Report</button>
    </div>`, modal => {
    modal.querySelector('#modal-cancel').addEventListener('click', window.closeModal);
    modal.querySelector('#modal-csv').addEventListener('click', () => {
      try {
        exportToCSV([tx], `cred_tx_${tx.id}`, _activeModel === 'compare' ? 'classical' : _activeModel);
        window.closeModal();
        window.showToast('CSV downloaded.', 'success');
      } catch (e) { window.showToast(e.message, 'error'); }
    });
    modal.querySelector('#modal-pdf').addEventListener('click', () => {
      try {
        exportToPDF([tx], `cred_tx_${tx.id}`, {
          userName: user?.name,
          batchName: `Transaction Audit: ${tx.merchant || tx.id}`,
          modelType: _activeModel === 'compare' ? 'classical' : _activeModel,
          exportedAt: new Date().toISOString(),
        });
        window.closeModal();
        window.showToast('PDF report downloaded.', 'success');
      } catch (e) { window.showToast(e.message, 'error'); }
    });
  });
}

function esc(str) { return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
