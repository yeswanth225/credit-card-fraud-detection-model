/**
 * transaction.js — Forensic Transaction Investigation Dossier for cred ai
 * Features side-by-side Classical vs Quantum model comparisons and full SHAP factor attribution.
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
        ${sidebarHTML(user, 'transactions')}
        <div class="main-content">
          ${headerHTML(null, `<a href="#/transactions">Transactions</a><span class="breadcrumb-sep">${icon('chevronRight', { size: 11 })}</span>Investigation`, user)}
          <main class="page-body">
            <div class="empty-state">
              <div class="empty-state-icon">${icon('search', { size: 36 })}</div>
              <div class="empty-state-title">Transaction record not found</div>
              <div class="empty-state-desc">The requested transaction record may have been deleted or does not exist in your account ledger.</div>
              <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="navigate('/transactions')">Back to Ledger</button>
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
  const batchName = batch?.fileName || (batch?.type === 'single' ? 'Quick Single Check' : 'Batch');
  const modelUpdated = new Date(AppMeta.getModelLastUpdated())
    .toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  APP().innerHTML = `
    <div class="app-shell">
      ${sidebarHTML(user, 'transactions')}
      <div class="main-content">
        ${headerHTML(null, `
          <a href="#/transactions">Transactions</a>
          <span class="breadcrumb-sep">${icon('chevronRight', { size: 11 })}</span>
          <a href="#${batchPath}">${esc(batchName)}</a>
          <span class="breadcrumb-sep">${icon('chevronRight', { size: 11 })}</span>
          <span style="color:var(--c-text-1)">${esc(tx.merchant || 'Investigation Dossier')}</span>
        `, user)}
        <main class="page-body animate-fade-in">

          <div class="section-header" style="margin-bottom:var(--sp-4)">
            <div>
              <div style="font-size:10px;font-weight:700;color:var(--c-text-3);text-transform:uppercase;letter-spacing:.05em">
                Forensic Investigation Dossier
              </div>
              <h2 class="section-title">${esc(tx.merchant || 'Transaction Entity')}</h2>
            </div>
            <div class="section-actions">
              <div class="model-toggle" role="group" aria-label="Model evaluation">
                <button class="model-toggle-btn active" id="tab-classical" data-model="classical">Classical XGBoost</button>
                <button class="model-toggle-btn quantum" id="tab-quantum" data-model="quantum">Quantum VQC</button>
                <button class="model-toggle-btn" id="tab-compare" data-model="compare">Side-by-Side Comparison</button>
              </div>
              <button class="btn btn-secondary btn-sm" id="tx-export-btn">
                ${icon('download', { size: 12 })} Export Dossier
              </button>
            </div>
          </div>

          <div class="tx-detail-grid">

            <!-- Left: Entity Metadata -->
            <div class="tx-meta-panel">
              <div style="margin-bottom:var(--sp-4)">
                <div style="font-size:11px;color:var(--c-text-3);font-family:var(--font-mono)">Settlement Amount</div>
                <div style="font-size:24px;font-weight:800;color:var(--c-text-1);font-family:var(--font-mono)">
                  ₹${Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <div class="tx-meta-row"><span class="tx-meta-key">Date / Time</span><span class="tx-meta-val mono">${esc(tx.date || '—')}</span></div>
                <div class="tx-meta-row"><span class="tx-meta-key">Merchant Entity</span><span class="tx-meta-val">${esc(tx.merchant || '—')}</span></div>
                <div class="tx-meta-row"><span class="tx-meta-key">MCC Code</span><span class="tx-meta-val mono">${tx.mcc || '5411'}</span></div>
                <div class="tx-meta-row"><span class="tx-meta-key">Payment Card</span><span class="tx-meta-val">${esc(tx.card_type || 'Visa')}</span></div>
                <div class="tx-meta-row"><span class="tx-meta-key">Country / Gateway</span><span class="tx-meta-val">${esc(tx.country || 'IN')}</span></div>
                <div class="tx-meta-row"><span class="tx-meta-key">Distance Home</span><span class="tx-meta-val mono">${tx.distance_from_home !== undefined ? `${tx.distance_from_home} km` : '—'}</span></div>
                <div class="tx-meta-row"><span class="tx-meta-key">Distance Last Tx</span><span class="tx-meta-val mono">${tx.distance_from_last_tx !== undefined ? `${tx.distance_from_last_tx} km` : '—'}</span></div>
                <div class="tx-meta-row"><span class="tx-meta-key">Failed 2FA Retries</span><span class="tx-meta-val mono">${tx.retry_attempts || 0}</span></div>
                <div class="tx-meta-row"><span class="tx-meta-key">Transaction UID</span><span class="tx-meta-val mono" style="font-size:10px">${esc(tx.id)}</span></div>
              </div>

              <div style="margin-top:var(--sp-4);padding-top:var(--sp-3);border-top:1px solid var(--c-border);font-size:11px;color:var(--c-text-3);display:flex;align-items:center;gap:6px">
                <span style="width:6px;height:6px;border-radius:50%;background:var(--c-low)"></span>
                Weights calibrated: ${modelUpdated}
              </div>
            </div>

            <!-- Right: Dynamic Analysis Panel -->
            <div id="tx-analysis-panel"></div>

          </div>

        </main>
      </div>
    </div>`;

  mountSidebarToggle();
  mountLogout(ctx);
  mountTabs(tx, ctx);
  renderModelPanel(tx, _activeModel);
}

function mountTabs(tx, ctx) {
  ['classical', 'quantum', 'compare'].forEach(m => {
    document.getElementById(`tab-${m}`)?.addEventListener('click', e => {
      _activeModel = m;
      document.querySelectorAll('.model-toggle-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      renderModelPanel(tx, _activeModel);
    });
  });

  document.getElementById('tx-export-btn')?.addEventListener('click', () => {
    exportToPDF([tx], `cred_ai_investigation_${tx.id}`, {
      userName: ctx.user?.name,
      batchName: 'Transaction Dossier',
      modelType: _activeModel === 'compare' ? 'classical' : _activeModel,
      exportedAt: new Date().toISOString(),
    });
    window.showToast('PDF dossier downloaded.', 'success');
  });
}

function renderModelPanel(tx, model) {
  const panel = document.getElementById('tx-analysis-panel');
  if (!panel) return;

  if (model === 'compare') {
    panel.innerHTML = renderCompareHTML(tx);
    return;
  }

  const r = tx[model] || tx.classical;
  const pct = Math.round((r?.score ?? 0) * 100);
  const level = getRiskLevel(r?.score ?? 0);
  const riskColor = level === 'high' ? 'var(--c-high)' : level === 'medium' ? 'var(--c-medium)' : 'var(--c-low)';

  panel.innerHTML = `
    <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--r-xl);padding:var(--sp-6)">
      <!-- Score Ribbon -->
      <div style="display:flex;align-items:center;gap:var(--sp-5);padding:var(--sp-4);background:var(--c-surface-2);border-radius:var(--r-lg);border:1px solid var(--c-border);margin-bottom:var(--sp-5)">
        <div style="font-family:var(--font-mono);font-size:42px;font-weight:800;color:${riskColor};line-height:1">
          ${pct}%
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span class="risk-indicator ${level}" style="font-weight:700">
              <span class="risk-dot"></span>${level === 'high' ? 'High Risk Intercept' : level === 'medium' ? 'Medium Risk Alert' : 'Verified Cleared'}
            </span>
            <span class="badge ${model === 'quantum' ? 'badge-quantum' : 'badge-classical'}">
              ${model === 'quantum' ? 'Quantum VQC Kernel' : 'Classical XGBoost Tree'}
            </span>
          </div>
          <div style="font-size:12px;color:var(--c-text-2)">
            ${r.flag ? 'Telemetry indicates anomalous payment signature.' : 'Telemetry is consistent with legitimate pattern.'}
          </div>
        </div>
      </div>

      <!-- Plain Language Rationale -->
      <div style="margin-bottom:var(--sp-5)">
        <div style="font-size:11px;font-weight:700;color:var(--c-text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px">
          Explainable Decision Rationale
        </div>
        <p class="explanation-text ${level}" style="margin:0">
          ${r.explanation}
        </p>
      </div>

      <!-- Contributing Risk Signals -->
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--c-text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px">
          Feature Importance Attribution
        </div>
        <div class="feature-list">
          ${r.features.map(f => `
            <div class="feature-item">
              <div class="feature-name">${esc(f.label)}</div>
              <div class="feature-bar-wrap">
                <div class="feature-bar ${f.direction}" style="width:${Math.round(f.magnitude * 100)}%"></div>
              </div>
              <div class="feature-dir ${f.direction}">
                ${f.direction === 'up' ? '↑ Risk' : '↓ Safe'}
              </div>
            </div>
            <div style="font-size:11px;color:var(--c-text-3);margin-top:-3px;margin-bottom:6px">
              ${esc(f.explanation)}
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function renderCompareHTML(tx) {
  const c = tx.classical;
  const q = tx.quantum;
  const cPct = Math.round((c?.score ?? 0) * 100);
  const qPct = Math.round((q?.score ?? 0) * 100);

  return `
    <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--r-xl);padding:var(--sp-6)">
      <h3 style="font-size:15px;font-weight:700;margin-bottom:var(--sp-4)">Classical vs Quantum Side-by-Side Evaluation</h3>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-bottom:var(--sp-5)">
        <div style="padding:var(--sp-4);background:var(--c-surface-2);border-radius:var(--r-lg);border:1px solid var(--c-border)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span class="badge badge-classical">Classical XGBoost</span>
            <span class="mono" style="font-size:18px;font-weight:800">${cPct}%</span>
          </div>
          <p style="font-size:12px;color:var(--c-text-2);margin:0">${c.explanation}</p>
        </div>

        <div style="padding:var(--sp-4);background:var(--c-surface-2);border-radius:var(--r-lg);border:1px solid var(--c-border)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span class="badge badge-quantum">Quantum VQC</span>
            <span class="mono" style="font-size:18px;font-weight:800;color:var(--c-quantum)">${qPct}%</span>
          </div>
          <p style="font-size:12px;color:var(--c-text-2);margin:0">${q.explanation}</p>
        </div>
      </div>

      <div style="font-size:12px;color:var(--c-text-3);line-height:1.5">
        <strong>Engine Divergence:</strong> Classical decision trees excel at threshold rules on velocity and amount. The Variational Quantum Classifier evaluates cross-variable correlations in Hilbert space, providing an orthogonal risk vector for defense-in-depth.
      </div>
    </div>`;
}

function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
