/**
 * dashboard.js — Fraud Intelligence Command Center for cred ai
 * Features 3D transaction flow topology, real-time metrics ribbon, live event stream, and batch triage.
 */

import { Batches, AppMeta } from '../store.js';
import { batchScore, getRiskLevel } from '../ml.js';
import { parseCSV, validateAndTransform, validateCSVFile } from '../csv.js';
import { generateForBatch, updateBell } from '../notifications.js';
import { icon } from '../icons.js';
import { sidebarHTML, headerHTML, mountSidebarToggle, mountLogout } from '../app.js';
import { DATASET_PRESETS } from '../seed-data.js';
import { TransactionFlowVisualizer } from '../visualizations/transaction-flow.js';

const APP = () => document.getElementById('app');

let _state = {
  batches: [],
  currentTxs: [],
  uploading: false,
};

let _flowVisualizer = null;

export function renderDashboard(ctx) {
  if (_flowVisualizer) {
    _flowVisualizer.dispose();
    _flowVisualizer = null;
  }

  const { user } = ctx;
  _state.batches = Batches.list(user.id);
  _state.currentTxs = _state.batches.flatMap(b => b.transactions || []);
  _state.uploading = false;
  updateBell(user.id);

  APP().innerHTML = buildDashboardHTML(ctx);
  mountDashboard(ctx);
}

function buildDashboardHTML(ctx) {
  const { user } = ctx;
  const stats = computeSummaryStats(_state.currentTxs);
  const recentTxs = _state.currentTxs.slice(0, 8);
  const modelUpdated = new Date(AppMeta.getModelLastUpdated())
    .toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  return `
    <div class="app-shell">
      ${sidebarHTML(user, 'dashboard')}
      <div class="main-content">
        ${headerHTML('Command Center', null, user)}
        <main class="page-body animate-fade-in" id="page-body">

          <!-- 1. TOP OPERATIONAL ACTION BAR -->
          <div class="quick-check-hero-bar" style="margin-bottom:var(--sp-6)">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
                <span class="badge badge-quantum" style="font-size:10px">
                  ${icon('zap', { size: 11 })} Real-Time Triage
                </span>
                <span style="font-size:11px;color:var(--c-text-3);font-family:var(--font-mono)">
                  Calibrated: ${modelUpdated}
                </span>
              </div>
              <div style="font-size:15px;font-weight:700;color:var(--c-text-1)">
                Transaction Intelligence Stream
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary" onclick="navigate('/single-check')" id="hero-quick-check-btn">
                ${icon('zap', { size: 14 })} Launch Quick Check
              </button>
              <button class="btn btn-secondary" id="btn-load-dataset-sample" title="Reload clean dataset">
                ${icon('database', { size: 13 })} Load Demo Data
              </button>
            </div>
          </div>

          <div class="dashboard-stage-grid">

            <!-- 2. 3D TRANSACTION FLOW VISUALIZATION & METRICS RIBBON -->
            <div class="flow-visualizer-card">
              <div class="flow-visualizer-header">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="width:7px;height:7px;border-radius:50%;background:var(--c-quantum);display:inline-block"></span>
                  <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--c-text-2)">
                    Live Multi-Tier Financial Network
                  </span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;font-size:11px;color:var(--c-text-3)">
                  <span style="display:flex;align-items:center;gap:4px">
                    <span style="width:6px;height:6px;border-radius:50%;background:var(--c-low)"></span> Normal
                  </span>
                  <span style="display:flex;align-items:center;gap:4px">
                    <span style="width:6px;height:6px;border-radius:50%;background:var(--c-high)"></span> Intercepted Fraud
                  </span>
                </div>
              </div>

              <!-- 3D Canvas Stage -->
              <div class="flow-canvas-wrap" id="flow-canvas-container"></div>

              <!-- Operational Metrics Ribbon -->
              <div class="metrics-ribbon">
                <div class="metric-cell">
                  <span class="metric-label">Total Transactions</span>
                  <span class="metric-value">${stats.total.toLocaleString('en-IN')}</span>
                  <span class="metric-sub">Across all ledger sessions</span>
                </div>
                <div class="metric-cell">
                  <span class="metric-label">High-Risk Intercepts</span>
                  <span class="metric-value" style="color:${stats.flagged ? 'var(--c-high)' : 'inherit'}">${stats.flagged.toLocaleString('en-IN')}</span>
                  <span class="metric-sub">Immediate action required</span>
                </div>
                <div class="metric-cell">
                  <span class="metric-label">Verified Cleared</span>
                  <span class="metric-value" style="color:var(--c-low)">${stats.clean.toLocaleString('en-IN')}</span>
                  <span class="metric-sub">Normal payment profile</span>
                </div>
                <div class="metric-cell">
                  <span class="metric-label">Anomaly Exposure</span>
                  <span class="metric-value">${stats.rate}%</span>
                  <span class="metric-sub">Hybrid triage confidence</span>
                </div>
              </div>
            </div>

            <!-- 3. LIVE RECENT TRANSACTIONS STREAM -->
            <section class="section" aria-labelledby="stream-heading">
              <div class="section-header">
                <div>
                  <h2 class="section-title" id="stream-heading">Recent Transaction Feed</h2>
                  <p class="section-subtitle">Real-time payment triage stream evaluated against classical and quantum models</p>
                </div>
                <a href="#/transactions" class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:4px">
                  View Ledger (${stats.total}) ${icon('chevronRight', { size: 11 })}
                </a>
              </div>

              ${recentTxs.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-state-icon">${icon('file', { size: 32 })}</div>
                  <div class="empty-state-title">No transactions evaluated yet</div>
                  <div class="empty-state-desc">Click "Launch Quick Check" or ingest a batch ledger to begin real-time triage.</div>
                  <button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="navigate('/single-check')">Launch Quick Check</button>
                </div>
              ` : `
                <div class="table-wrap">
                  <table class="data-table" aria-label="Recent Transactions">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Merchant Entity</th>
                        <th class="text-right">Settlement (₹)</th>
                        <th>Instrument</th>
                        <th>Routing</th>
                        <th style="text-align:center">Fraud Prob.</th>
                        <th>Risk Assessment</th>
                        <th class="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${recentTxs.map(tx => {
                        const r = tx.classical || tx.quantum;
                        const pct = Math.round((r?.score ?? 0) * 100);
                        const level = getRiskLevel(r?.score ?? 0);
                        return `
                          <tr class="clickable${r?.flag ? ' flagged' : ''}" onclick="navigate('/transaction/${tx.id}')" role="link" tabindex="0">
                            <td class="muted mono">${esc(tx.date || '—')}</td>
                            <td style="font-weight:600">${esc(tx.merchant || '—')}</td>
                            <td class="mono text-right" style="font-weight:600">₹${Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td class="muted">${esc(tx.card_type || 'Visa')}</td>
                            <td class="muted">${esc(tx.country || 'IN')}</td>
                            <td style="text-align:center">
                              <span class="score-pill ${level}">${pct}%</span>
                            </td>
                            <td>
                              <span class="risk-indicator ${level}">
                                <span class="risk-dot"></span>${level === 'high' ? 'High Risk' : level === 'medium' ? 'Review' : 'Cleared'}
                              </span>
                            </td>
                            <td class="text-right">
                              <span class="btn btn-ghost btn-sm" style="padding:2px 6px;font-size:11px">
                                Inspect ${icon('chevronRight', { size: 10 })}
                              </span>
                            </td>
                          </tr>`;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              `}
            </section>

            <!-- 4. SECONDARY: Batch Statement Ingestion -->
            <section class="section" aria-labelledby="ingest-heading">
              <div class="ingestion-strip">
                <div class="section-header" style="margin-bottom:var(--sp-3)">
                  <div>
                    <h3 class="section-title" id="ingest-heading" style="font-size:14px;display:flex;align-items:center;gap:6px">
                      ${icon('upload', { size: 14 })} Bulk Statement Ledger Ingestion
                    </h3>
                    <p class="section-subtitle">Process large multi-record CSV transaction batches through the ML scoring pipeline</p>
                  </div>
                </div>

                <div class="compact-upload-zone" id="upload-zone" role="button" tabindex="0" aria-label="Upload CSV file">
                  <input type="file" id="csv-file-input" accept=".csv" aria-hidden="true">
                  <div class="compact-upload-text">Drop .csv transaction statement here or <span style="text-decoration:underline">browse files</span></div>
                  <div class="compact-upload-hint">Supported schema: amount, merchant, mcc, country, card_type, hour, distance_from_home</div>
                </div>

                <div id="upload-progress-area" style="display:none;margin-top:var(--sp-3)"></div>

                <div style="display:flex;gap:var(--sp-2);margin-top:var(--sp-3);flex-wrap:wrap">
                  <a href="sample_dataset_transactions.csv" download="sample_dataset_transactions.csv" class="btn btn-secondary btn-sm" style="font-size:11px" title="Download sample CSV template">
                    ${icon('download', { size: 12 })} Download CSV Template
                  </a>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>`;
}

function computeSummaryStats(txs) {
  const flagged = txs.filter(tx => (tx.classical || tx.quantum)?.flag).length;
  const clean = txs.length - flagged;
  const rate = txs.length ? Math.round(flagged / txs.length * 100) : 0;
  return { total: txs.length, flagged, clean, rate };
}

function mountDashboard(ctx) {
  const { user } = ctx;
  mountSidebarToggle();
  mountLogout(ctx);

  // Mount 3D Flow Visualizer
  const flowContainer = document.getElementById('flow-canvas-container');
  if (flowContainer) {
    _flowVisualizer = new TransactionFlowVisualizer(flowContainer, {
      height: 250,
      transactions: _state.currentTxs,
      onSelect: (node) => {
        window.showToast(`Inspecting network node: ${node.label}`, 'info', 2500);
      }
    });
  }

  document.getElementById('btn-load-dataset-sample')?.addEventListener('click', () => {
    Batches.seedDataset(user.id, true);
    updateBell(user.id);
    window.showToast('Demo dataset loaded with authentic credit card records.', 'success');
    renderDashboard(ctx);
  });

  mountUploadZone(ctx);
}

function mountUploadZone(ctx) {
  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('csv-file-input');
  if (!zone || !fileInput) return;

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (file) handleFileUpload(file, ctx);
  });

  zone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file, ctx);
    fileInput.value = '';
  });
}

async function handleFileUpload(file, ctx) {
  if (_state.uploading) return;
  const { user } = ctx;

  const fileCheck = validateCSVFile(file);
  if (!fileCheck.valid) {
    window.showToast(fileCheck.error, 'error', 7000);
    return;
  }

  _state.uploading = true;
  const zone = document.getElementById('upload-zone');
  if (zone) zone.style.pointerEvents = 'none';

  const progressArea = document.getElementById('upload-progress-area');
  const steps = ['Parsing CSV structure', 'Validating Schema', 'Scoring Classical & Quantum Models', 'Finalizing Ledger'];

  function setProgress(stepIdx, pct, detail) {
    if (!progressArea) return;
    progressArea.style.display = 'block';
    progressArea.innerHTML = `
      <div style="padding:12px;background:var(--c-surface-2);border-radius:var(--r-md);font-size:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-weight:600">
          <span>${icon('file', { size: 13 })} ${esc(file.name)}</span>
          <span class="mono">${pct}%</span>
        </div>
        <div style="height:4px;background:var(--c-border);border-radius:var(--r-full);overflow:hidden;margin-bottom:8px">
          <div style="height:100%;width:${pct}%;background:var(--c-quantum);transition:width 0.2s"></div>
        </div>
        <div style="font-size:11px;color:var(--c-text-3)">${steps[stepIdx]}${detail ? ` (${detail})` : ''}</div>
      </div>`;
  }

  try {
    setProgress(0, 20, '');
    await delay(100);
    const text = await file.text();
    const parsed = parseCSV(text);

    setProgress(1, 40, '');
    await delay(100);
    const result = validateAndTransform(parsed);
    if (!result.valid) {
      _state.uploading = false;
      if (zone) zone.style.pointerEvents = '';
      if (progressArea) progressArea.style.display = 'none';
      window.showToast(result.errors.join(' '), 'error', 9000);
      return;
    }

    setProgress(2, 70, `${result.transactions.length} records`);
    const scored = await batchScore(result.transactions, (done, total) => {
      const pct = Math.round(70 + (done / total) * 25);
      setProgress(2, pct, `${done} / ${total}`);
    });

    setProgress(3, 100, 'Saving');
    await delay(150);
    const batch = Batches.create(user.id, {
      type: 'csv',
      fileName: file.name,
      transactions: scored,
      modelUsed: 'classical',
    });
    AppMeta.setModelLastUpdated();

    generateForBatch(user.id, batch.id, scored, user.notificationPrefs);

    _state.uploading = false;
    window.showToast(`Batch processed: ${scored.length} transactions scored.`, 'success');
    renderDashboard(ctx);

  } catch (e) {
    _state.uploading = false;
    if (zone) zone.style.pointerEvents = '';
    if (progressArea) progressArea.style.display = 'none';
    console.error('[cred ai] upload error', e);
    window.showToast('Error processing file. Please verify CSV format.', 'error');
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(str) { return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
