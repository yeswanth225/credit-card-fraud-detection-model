/**
 * dashboard.js — Main dashboard screen for [cred]
 * Features balanced dual-action cards, INR currency localization, SVG icon system,
 * dynamic transaction overview metrics (Average Risk Score), and fraud trend overview.
 */

import { Auth, Batches, AppMeta } from '../store.js';
import { batchScore, getRiskLevel } from '../ml.js';
import { parseCSV, validateAndTransform, validateCSVFile, REQUIRED_COLUMNS } from '../csv.js';
import { exportToCSV, exportToPDF } from '../export.js';
import { generateForBatch, updateBell } from '../notifications.js';
import { icon } from '../icons.js';
import { sidebarHTML, headerHTML, mountSidebarToggle, mountLogout } from '../app.js';

const APP = () => document.getElementById('app');

let _state = {
  batches: [],
  selectedBatchId: 'all',
  currentBatch: null,
  currentTxs: [],
  modelType: 'classical',
  sortKey: 'score',
  sortDir: 'desc',
  filterRisk: 'all',
  filterSearch: '',
  page: 1,
  pageSize: 25,
  uploading: false,
};

export function renderDashboard(ctx) {
  const { user } = ctx;
  _state.batches = Batches.list(user.id);

  if (_state.selectedBatchId === 'all') {
    _state.currentBatch = null;
    _state.currentTxs = _state.batches.flatMap(b => b.transactions || []);
  } else {
    _state.currentBatch = _state.batches.find(b => b.id === _state.selectedBatchId) || _state.batches[0] || null;
    _state.currentTxs = _state.currentBatch?.transactions || [];
    if (!_state.currentBatch) {
      _state.selectedBatchId = 'all';
      _state.currentTxs = _state.batches.flatMap(b => b.transactions || []);
    }
  }

  _state.uploading = false;
  updateBell(user.id);

  APP().innerHTML = buildShell(ctx);
  mountShell(ctx);
  renderTableSection(ctx);
}

function buildShell(ctx) {
  const { user } = ctx;
  const recent = Batches.recent(user.id, 5);
  const stats = computeStats();
  const modelUpdated = new Date(AppMeta.getModelLastUpdated())
    .toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  return `
    <div class="app-shell">
      ${sidebarHTML(user, 'dashboard')}
      <div class="main-content">
        ${headerHTML('Dashboard', null, user)}
        <main class="page-body" id="page-body">

          <!-- Balanced Actions: CSV Upload & Quick Check -->
          <section class="section" aria-labelledby="actions-heading">
            <div class="section-header">
              <div>
                <h2 class="section-title" id="actions-heading">Fraud Analysis Operations</h2>
                <p class="section-subtitle">Process batch transaction ledgers or audit individual payments instantly</p>
              </div>
              <div class="adaptive-indicator" title="Model weights calibrated against recent fraud patterns">
                <span class="adaptive-dot"></span>
                Model active & calibrated (${modelUpdated})
              </div>
            </div>

            <div class="dashboard-actions-grid">
              <!-- Action 1: Batch CSV Upload -->
              <div class="action-card">
                <div>
                  <div class="action-card-header">
                    <div class="action-card-icon">${icon('upload', { size: 18 })}</div>
                    <div>
                      <div class="action-card-title">Batch Ledger Ingestion</div>
                      <div class="action-card-desc">Upload CSV transaction statements for high-throughput batch triage</div>
                    </div>
                  </div>

                  <div class="compact-upload-zone" id="upload-zone" role="button" tabindex="0"
                    aria-label="Upload CSV file" style="margin-top:var(--sp-4)">
                    <input type="file" id="csv-file-input" accept=".csv" aria-hidden="true">
                    <div class="compact-upload-text">Drop .csv file here or <span style="text-decoration:underline">browse</span></div>
                    <div class="compact-upload-hint">Max 5 MB · Schema: amount, merchant, mcc, country, card_type, hour, distance_from_home</div>
                  </div>

                  <div id="upload-progress-area" style="display:none"></div>

                  <div style="margin-top:var(--sp-3);display:flex;gap:var(--sp-2);">
                    <button type="button" class="btn btn-secondary btn-sm" id="btn-load-dataset-sample" style="flex:1;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;">
                      ${icon('database', { size: 14 })} Load Dataset Sample (35 Tx)
                    </button>
                    <a href="sample_dataset_transactions.csv" download="sample_dataset_transactions.csv" class="btn btn-secondary btn-sm" style="font-size:12px;display:flex;align-items:center;gap:4px;" title="Download sample CSV from Credit Card Dataset">
                      ${icon('download', { size: 14 })} Sample CSV
                    </a>
                  </div>
                </div>

                <button class="connect-bank-btn" disabled aria-disabled="true" title="Direct CBS/API gateway integration coming soon">
                  ${icon('creditCard', { size: 14 })} Direct Core Banking Sync (Coming soon)
                </button>
              </div>

              <!-- Action 2: Quick Single Check -->
              <div class="action-card">
                <div>
                  <div class="action-card-header">
                    <div class="action-card-icon">${icon('zap', { size: 18 })}</div>
                    <div>
                      <div class="action-card-title">Quick Single Check</div>
                      <div class="action-card-desc">Audit a specific transaction in real-time with comprehensive risk factor breakdown</div>
                    </div>
                  </div>

                  <div style="margin-top:var(--sp-4);padding:var(--sp-4);background-color:var(--c-surface-2);border-radius:var(--radius-md);font-size:var(--text-xs);color:var(--c-text-2);line-height:var(--leading-relaxed)">
                    Evaluate transactions across 13 parameters including merchant velocity, geolocation anomalies, and authentication cryptograms.
                  </div>
                </div>

                <button class="btn btn-primary" onclick="navigate('/single-check')" id="quick-check-btn" style="width:100%">
                  ${icon('zap', { size: 16 })} Launch Single Check
                </button>
              </div>
            </div>
          </section>

          <!-- Transaction Overview Section -->
          <section class="section" aria-labelledby="stats-heading">
            <h2 class="section-title" id="stats-heading" style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--c-text-3);font-weight:600;margin-bottom:var(--sp-3)">
              Transaction Overview
            </h2>
            <div class="stats-and-trend-grid" id="stats-grid">
              ${renderStatsAndTrendHTML(stats, _state.batches)}
            </div>
          </section>

          <!-- Transactions table -->
          <section class="section" id="transactions-section" aria-labelledby="tx-heading">
            <div class="section-header">
              <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                <h2 class="section-title" id="tx-heading">
                  ${_state.selectedBatchId === 'all'
      ? `All Transactions <span style="font-size:13px;font-weight:500;color:var(--c-text-3)">(${_state.currentTxs.length} Total)</span>`
      : `Batch: <span style="font-weight:500;color:var(--c-text-3)">${_state.currentBatch?.fileName || 'Selected Batch'}</span>`}
                </h2>
                ${_state.batches.length > 1 ? `
                  <select class="form-select" id="dashboard-batch-select" style="font-size:12px;padding:4px 28px 4px 10px;height:32px;max-width:280px;">
                    <option value="all" ${_state.selectedBatchId === 'all' ? 'selected' : ''}>All Batches Combined (${_state.batches.flatMap(b => b.transactions || []).length} Tx)</option>
                    ${_state.batches.map(b => `
                      <option value="${b.id}" ${_state.selectedBatchId === b.id ? 'selected' : ''}>
                        ${b.fileName || 'Quick Single Check'} (${b.transactions?.length || 0} Tx)
                      </option>
                    `).join('')}
                  </select>
                ` : ''}
              </div>
              <div class="section-actions">
                <div class="model-toggle" role="group" aria-label="Select model">
                  <button class="model-toggle-btn active" id="toggle-classical" data-model="classical">Classical</button>
                  <button class="model-toggle-btn quantum" id="toggle-quantum" data-model="quantum">Quantum</button>
                </div>
                <button class="btn btn-secondary btn-sm" id="export-btn" ${_state.currentTxs.length === 0 ? 'disabled' : ''}>
                  ${icon('download', { size: 14 })} Export
                </button>
              </div>
            </div>

            <div id="filter-row-container"></div>
            <div id="tx-table-container"></div>
            <div id="pagination-container"></div>
          </section>

          <!-- Recent Batches -->
          ${recent.length ? `
          <section class="section" aria-labelledby="batches-heading">
            <div class="section-header">
              <h2 class="section-title" id="batches-heading">Recent Batch Uploads</h2>
              <a href="#/history" class="btn btn-ghost btn-sm">View History ${icon('arrowRight', { size: 12 })}</a>
            </div>
            <div class="history-list">${recent.map(b => batchItemHTML(b)).join('')}</div>
          </section>` : ''}

        </main>
      </div>
    </div>`;
}

function computeStats() {
  const txs = _state.currentTxs;
  const flagged = txs.filter(tx => (tx[_state.modelType] || tx.classical)?.flag).length;
  const totalScore = txs.reduce((sum, tx) => sum + ((tx[_state.modelType] || tx.classical)?.score ?? 0), 0);
  const avgScore = txs.length ? Math.round((totalScore / txs.length) * 100) : 0;

  return {
    total: txs.length,
    flagged,
    rate: txs.length ? Math.round(flagged / txs.length * 100) : 0,
    avgScore,
  };
}

function renderStatsAndTrendHTML(stats, batches) {
  const modelLabel = _state.modelType === 'quantum' ? 'Quantum VQC' : 'Classical XGBoost';

  const recentBatches = batches.slice(0, 6).reverse();
  const sparkData = recentBatches.length > 0
    ? recentBatches.map(b => {
      const total = b.transactions?.length || 1;
      const fl = b.transactions?.filter(t => (t[_state.modelType] || t.classical)?.flag).length || 0;
      const rate = Math.round((fl / total) * 100);
      return { label: (b.fileName || 'Batch').slice(0, 4), rate, flagged: fl };
    })
    : [
      { label: 'W1', rate: 12, flagged: 3 },
      { label: 'W2', rate: 18, flagged: 5 },
      { label: 'W3', rate: 8, flagged: 2 },
      { label: 'W4', rate: 22, flagged: 6 },
      { label: 'W5', rate: 15, flagged: 4 },
      { label: 'Now', rate: stats.rate, flagged: stats.flagged },
    ];

  return `
    <div class="stat-card">
      <div class="stat-label">Transactions</div>
      <div class="stat-value">${stats.total.toLocaleString('en-IN')}</div>
      <div class="stat-sub">${_state.currentBatch ? 'in current batch' : 'no batch loaded'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Flagged Transactions</div>
      <div class="stat-value" style="color:${stats.flagged ? 'var(--c-high)' : 'inherit'}">${stats.flagged.toLocaleString('en-IN')}</div>
      <div class="stat-sub">potential fraud</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Fraud Rate</div>
      <div class="stat-value">${stats.rate}%</div>
      <div class="stat-sub">${modelLabel}</div>
    </div>
    <!-- Mini Trend Card -->
    <div class="trend-card">
      <div class="trend-header">
        <span class="trend-title">Fraud Risk Trend</span>
        <span style="font-size:11px;color:var(--c-text-3)">${icon('trendingUp', { size: 13 })} Avg Risk: <strong class="mono" style="color:var(--c-text-1)">${stats.avgScore}%</strong></span>
      </div>
      <div class="trend-sparkline-wrap">
        ${sparkData.map(d => {
    const barHeight = Math.max(12, Math.min(100, d.rate * 2.5));
    const isHigh = d.rate >= 20;
    return `
            <div class="trend-bar-col" title="${d.label}: ${d.rate}% (${d.flagged} flagged)">
              <div class="trend-bar${isHigh ? ' high' : ''}" style="height:${barHeight}%"></div>
              <span class="trend-bar-label">${d.label}</span>
            </div>`;
  }).join('')}
      </div>
    </div>`;
}

function batchItemHTML(batch) {
  const flagged = batch.transactions?.filter(tx => tx.classical?.flag).length || 0;
  const date = new Date(batch.uploadedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  return `
    <div class="history-item" onclick="navigate('/history/${batch.id}')" role="link" tabindex="0"
      aria-label="Batch: ${batch.fileName || 'Single check'}, ${date}">
      <div class="history-item-icon">
        ${icon(batch.type === 'single' ? 'zap' : 'file', { size: 18 })}
      </div>
      <div class="history-item-body">
        <div class="history-item-name">${esc(batch.fileName || (batch.type === 'single' ? 'Single Check' : 'Batch Ledger'))}</div>
        <div class="history-item-meta">${date} · ${batch.transactions?.length || 0} transactions</div>
      </div>
      <div class="history-item-stats">
        ${flagged > 0 ? `<span class="history-item-flagged">${icon('alertTriangle', { size: 13 })} ${flagged} flagged</span>` : '<span style="font-size:12px;color:var(--c-low)">Clean</span>'}
      </div>
      <div class="history-item-actions">
        <button class="btn btn-secondary btn-sm">View ${icon('chevronRight', { size: 12 })}</button>
      </div>
    </div>`;
}

function renderFilterRow() {
  return `
    <div class="filter-row" role="search" aria-label="Filter transactions">
      <div class="filter-search">
        <span class="filter-search-icon" aria-hidden="true">${icon('search', { size: 14 })}</span>
        <input class="form-input" id="search-input" type="search"
          placeholder="Search merchant, country, ID…" aria-label="Search transactions"
          value="${esc(_state.filterSearch)}">
      </div>
      <select class="form-select" id="risk-filter" aria-label="Filter by risk level" style="width:150px">
        <option value="all"    ${_state.filterRisk === 'all' ? 'selected' : ''}>All risk levels</option>
        <option value="high"   ${_state.filterRisk === 'high' ? 'selected' : ''}>High risk (≥70%)</option>
        <option value="medium" ${_state.filterRisk === 'medium' ? 'selected' : ''}>Medium risk (40-69%)</option>
        <option value="low"    ${_state.filterRisk === 'low' ? 'selected' : ''}>Low risk (&lt;40%)</option>
      </select>
    </div>`;
}

function filteredTxs() {
  let txs = _state.currentTxs;
  if (_state.filterSearch) {
    const q = _state.filterSearch.toLowerCase();
    txs = txs.filter(tx =>
      (tx.merchant || '').toLowerCase().includes(q) ||
      (tx.country || '').toLowerCase().includes(q) ||
      (tx.id || '').toLowerCase().includes(q));
  }
  if (_state.filterRisk !== 'all') {
    txs = txs.filter(tx => {
      const r = tx[_state.modelType] || tx.classical;
      return getRiskLevel(r?.score ?? 0) === _state.filterRisk;
    });
  }
  txs = [...txs].sort((a, b) => {
    const ra = a[_state.modelType] || a.classical;
    const rb = b[_state.modelType] || b.classical;
    let va, vb;
    switch (_state.sortKey) {
      case 'score': va = ra?.score ?? 0; vb = rb?.score ?? 0; break;
      case 'amount': va = a.amount ?? 0; vb = b.amount ?? 0; break;
      case 'date': va = a.date || ''; vb = b.date || ''; break;
      case 'merchant': va = a.merchant || ''; vb = b.merchant || ''; break;
      default: va = 0; vb = 0;
    }
    return _state.sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });
  return txs;
}

function renderTableSection(ctx) {
  const filterContainer = document.getElementById('filter-row-container');
  const tableContainer = document.getElementById('tx-table-container');
  const pageContainer = document.getElementById('pagination-container');
  if (!tableContainer) return;

  if (!_state.currentBatch) {
    if (filterContainer) filterContainer.innerHTML = '';
    tableContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${icon('file', { size: 36 })}</div>
        <div class="empty-state-title">No transactions loaded</div>
        <div class="empty-state-desc">Upload a CSV batch above to get started, or run a Quick Single Check.</div>
      </div>`;
    if (pageContainer) pageContainer.innerHTML = '';
    return;
  }

  if (filterContainer) filterContainer.innerHTML = renderFilterRow();
  const txs = filteredTxs();
  const total = txs.length;
  const pages = Math.max(1, Math.ceil(total / _state.pageSize));
  const page = Math.min(_state.page, pages);
  const start = (page - 1) * _state.pageSize;
  const pageTxs = txs.slice(start, start + _state.pageSize);

  const sortIcon = k => {
    if (_state.sortKey !== k) return `<span class="sort-icon">${icon('chevronDown', { size: 12 })}</span>`;
    return `<span class="sort-icon">${icon(_state.sortDir === 'asc' ? 'arrowUp' : 'arrowDown', { size: 12 })}</span>`;
  };
  const thCls = k => `sortable${_state.sortKey === k ? ` sorted-${_state.sortDir}` : ''}`;

  const desktopTable = `
    <div class="table-wrap" style="display:none" id="desktop-table">
      <table class="data-table" aria-label="Transactions">
        <thead><tr>
          <th class="${thCls('date')}" data-sort="date">Date${sortIcon('date')}</th>
          <th class="${thCls('merchant')}" data-sort="merchant">Merchant${sortIcon('merchant')}</th>
          <th class="${thCls('amount')} text-right" data-sort="amount">Amount${sortIcon('amount')}</th>
          <th>MCC</th>
          <th>Country</th>
          <th class="${thCls('score')} col-score" data-sort="score" style="text-align:center">Fraud Score${sortIcon('score')}</th>
          <th class="col-risk">Risk Level</th>
          <th class="col-status">Status</th>
        </tr></thead>
        <tbody>
          ${pageTxs.map(tx => {
    const r = tx[_state.modelType] || tx.classical;
    const pct = Math.round((r?.score ?? 0) * 100);
    const level = getRiskLevel(r?.score ?? 0);
    return `
              <tr class="clickable${r?.flag ? ' flagged' : ''}"
                onclick="navigate('/transaction/${tx.id}')"
                role="link" tabindex="0" aria-label="Transaction: ${esc(tx.merchant)}, ₹${tx.amount}">
                <td class="muted">${esc(tx.date || '—')}</td>
                <td style="font-weight:500">${esc(tx.merchant || '—')}</td>
                <td class="mono text-right">₹${Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="muted mono">${tx.mcc || '—'}</td>
                <td class="muted">${esc(tx.country || '—')}</td>
                <td class="col-score" style="text-align:center">
                  <span class="score-pill ${level}">${pct}%</span>
                </td>
                <td class="col-risk">
                  <span class="risk-indicator ${level}">
                    <span class="risk-dot"></span>${level === 'high' ? 'High Risk' : level === 'medium' ? 'Medium Risk' : 'Low Risk'}
                  </span>
                </td>
                <td class="col-status">
                  ${r?.flag ? `<span class="badge badge-high">${icon('alertTriangle', { size: 11 })} Flagged</span>` : `<span class="badge badge-low">${icon('check', { size: 11 })} Normal</span>`}
                </td>
              </tr>`;
  }).join('')}
          ${pageTxs.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--c-text-3)">No records match your filters.</td></tr>` : ''}
        </tbody>
      </table>
    </div>`;

  const mobileCards = `
    <div class="table-wrap" id="mobile-cards" style="display:none">
      ${pageTxs.length === 0
      ? `<div style="text-align:center;padding:32px;color:var(--c-text-3)">No records match your filters.</div>`
      : pageTxs.map(tx => {
        const r = tx[_state.modelType] || tx.classical;
        const pct = Math.round((r?.score ?? 0) * 100);
        const level = getRiskLevel(r?.score ?? 0);
        return `
              <div class="tx-card" onclick="navigate('/transaction/${tx.id}')" role="link" tabindex="0" style="padding:var(--sp-4);border-bottom:1px solid var(--c-border)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                  <span style="font-weight:600">${esc(tx.merchant || '—')}</span>
                  <span class="mono" style="font-weight:700">₹${Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--c-text-3)">
                  <span>${esc(tx.date || '—')} · ${esc(tx.country || 'IN')}</span>
                  <span class="risk-indicator ${level}">
                    <span class="risk-dot"></span>${pct}% (${level})
                  </span>
                </div>
              </div>`;
      }).join('')}
    </div>`;

  tableContainer.innerHTML = desktopTable + mobileCards;
  applyResponsiveTable();

  if (pageContainer) pageContainer.innerHTML = pages > 1 ? renderPagination(page, pages, total) : '';

  document.getElementById('search-input')?.addEventListener('input', e => {
    _state.filterSearch = e.target.value;
    _state.page = 1;
    renderTableSection(ctx);
  });
  document.getElementById('risk-filter')?.addEventListener('change', e => {
    _state.filterRisk = e.target.value;
    _state.page = 1;
    renderTableSection(ctx);
  });
  document.querySelectorAll('[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (_state.sortKey === k) _state.sortDir = _state.sortDir === 'asc' ? 'desc' : 'asc';
      else { _state.sortKey = k; _state.sortDir = 'desc'; }
      renderTableSection(ctx);
    });
  });
  document.querySelectorAll('.page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      _state.page = parseInt(btn.dataset.page, 10);
      renderTableSection(ctx);
    });
  });
}

function renderPagination(page, pages, total) {
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);
  let html = `<div class="pagination" role="navigation" aria-label="Pagination">
    <button class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous page">${icon('chevronDown', { size: 12, className: 'rotate-90' })}</button>`;
  for (let p = start; p <= end; p++) {
    html += `<button class="page-btn${p === page ? ' active' : ''}" data-page="${p}" aria-label="Page ${p}" aria-current="${p === page ? 'page' : 'false'}">${p}</button>`;
  }
  html += `<button class="page-btn" data-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Next page">${icon('chevronDown', { size: 12, className: 'rotate-270' })}</button>
    <span class="page-info">${total.toLocaleString('en-IN')} results</span>
  </div>`;
  return html;
}

function applyResponsiveTable() {
  const desktop = document.getElementById('desktop-table');
  const mobile = document.getElementById('mobile-cards');
  if (!desktop || !mobile) return;
  const isNarrow = window.innerWidth < 700;
  desktop.style.display = isNarrow ? 'none' : 'block';
  mobile.style.display = isNarrow ? 'block' : 'none';
}

function mountShell(ctx) {
  const { user } = ctx;
  mountSidebarToggle();
  mountLogout(ctx);
  window.addEventListener('resize', applyResponsiveTable);

  document.getElementById('toggle-classical')?.addEventListener('click', () => switchModel('classical', ctx));
  document.getElementById('toggle-quantum')?.addEventListener('click', () => switchModel('quantum', ctx));
  document.getElementById('export-btn')?.addEventListener('click', () => doExport(user));

  document.getElementById('dashboard-batch-select')?.addEventListener('change', e => {
    _state.selectedBatchId = e.target.value;
    _state.page = 1;
    renderDashboard(ctx);
  });

  document.getElementById('btn-load-dataset-sample')?.addEventListener('click', () => {
    Batches.seedDataset(user.id, true);
    _state.selectedBatchId = 'all';
    _state.page = 1;
    updateBell(user.id);
    window.showToast('Authentic credit card dataset reloaded with clean stats!', 'success');
    renderDashboard(ctx);
  });

  mountUploadZone(ctx);
}

function switchModel(type, ctx) {
  _state.modelType = type;
  document.getElementById('toggle-classical')?.classList.toggle('active', type === 'classical');
  document.getElementById('toggle-quantum')?.classList.toggle('active', type === 'quantum');
  document.getElementById('toggle-quantum')?.classList.toggle('quantum', type === 'quantum');

  const stats = computeStats();
  const sg = document.getElementById('stats-grid');
  if (sg) sg.innerHTML = renderStatsAndTrendHTML(stats, _state.batches);
  renderTableSection(ctx);
}

function doExport(user) {
  if (!_state.currentBatch) return;
  const txs = filteredTxs();
  if (!txs.length) { window.showToast('No transactions to export.', 'warning'); return; }
  try {
    ctx_export(txs, _state.currentBatch, _state.modelType, user);
  } catch (e) { window.showToast(e.message, 'error'); }
}

function ctx_export(txs, batch, modelType, user) {
  window.showModal(`
    <h2 class="modal-title">Export Transactions</h2>
    <p class="modal-body">Choose your export format. ${txs.length.toLocaleString('en-IN')} transaction records will be generated.</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-csv">${icon('download', { size: 14 })} CSV</button>
      <button class="btn btn-primary" id="modal-pdf">${icon('download', { size: 14 })} PDF Report</button>
    </div>`, modal => {
    modal.querySelector('#modal-cancel').addEventListener('click', window.closeModal);
    modal.querySelector('#modal-csv').addEventListener('click', () => {
      try {
        exportToCSV(txs, `cred_export_${Date.now()}`, modelType);
        window.closeModal();
        window.showToast('CSV downloaded successfully.', 'success');
      } catch (e) { window.showToast(e.message, 'error'); }
    });
    modal.querySelector('#modal-pdf').addEventListener('click', () => {
      try {
        exportToPDF(txs, `cred_report_${Date.now()}`, {
          userName: user?.name,
          batchName: batch.fileName || 'Fraud Triage Report',
          modelType,
          exportedAt: new Date().toISOString(),
        });
        window.closeModal();
        window.showToast('PDF downloaded successfully.', 'success');
      } catch (e) { window.showToast(e.message, 'error'); }
    });
  });
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
  const steps = ['Parsing CSV structure', 'Validating column schema', 'Simulating Hybrid ML triage', 'Finalizing batch ledger'];

  function setProgress(stepIdx, pct, detail) {
    if (!progressArea) return;
    progressArea.style.display = 'block';
    progressArea.innerHTML = `
      <div class="upload-progress-card">
        <div class="upload-progress-header">
          <span class="upload-progress-file">${icon('file', { size: 14 })} ${esc(file.name)}</span>
          <span class="upload-progress-pct">${pct}%</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
        <div class="upload-steps">
          ${steps.map((s, i) => `
            <div class="upload-step${i < stepIdx ? ' done' : i === stepIdx ? ' active' : ''}">
              <span>${i < stepIdx ? icon('check', { size: 12 }) : i === stepIdx ? '◌' : (i + 1)}</span>
              <span>${s}${i === stepIdx && detail ? ` — ${detail}` : ''}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  try {
    setProgress(0, 10, '');
    await delay(100);
    const text = await file.text();
    const parsed = parseCSV(text);

    setProgress(1, 25, '');
    await delay(100);
    const result = validateAndTransform(parsed);
    if (!result.valid) {
      _state.uploading = false;
      if (zone) zone.style.pointerEvents = '';
      if (progressArea) progressArea.style.display = 'none';
      window.showToast(result.errors.join(' '), 'error', 9000);
      return;
    }
    if (result.warnings?.length) {
      window.showToast(`${result.warnings.length} row(s) had format issues and were skipped.`, 'warning', 6000);
    }

    setProgress(2, 40, `0 / ${result.transactions.length}`);
    const scored = await batchScore(result.transactions, (done, total) => {
      const pct = Math.round(40 + (done / total) * 50);
      setProgress(2, pct, `${done.toLocaleString('en-IN')} / ${total.toLocaleString('en-IN')}`);
    });

    setProgress(3, 95, '');
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
    _state.batches = Batches.list(user.id);
    _state.currentBatch = batch;
    _state.currentTxs = scored;
    _state.page = 1;
    _state.filterSearch = '';
    _state.filterRisk = 'all';

    window.showToast(`Analyzed ${scored.length.toLocaleString('en-IN')} transactions successfully.`, 'success');
    renderDashboard(ctx);

  } catch (e) {
    _state.uploading = false;
    if (zone) zone.style.pointerEvents = '';
    if (progressArea) progressArea.style.display = 'none';
    console.error('[cred] upload error', e);
    window.showToast('An unexpected error occurred while processing your file. Please try again.', 'error');
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(str) { return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
