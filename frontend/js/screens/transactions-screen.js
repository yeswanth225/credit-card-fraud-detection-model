/**
 * transactions-screen.js — Professional Financial Transactions Ledger for cred ai
 * Features high-density financial layout, multi-variable filters, tabular currency alignment, and batch triage.
 */

import { Batches } from '../store.js';
import { getRiskLevel } from '../ml.js';
import { exportToCSV, exportToPDF } from '../export.js';
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
  pageSize: 20,
};

export function renderTransactionsScreen(ctx) {
  const { user } = ctx;
  _state.batches = Batches.list(user.id);

  if (_state.selectedBatchId === 'all') {
    _state.currentBatch = null;
    _state.currentTxs = _state.batches.flatMap(b => b.transactions || []);
  } else {
    _state.currentBatch = _state.batches.find(b => b.id === _state.selectedBatchId) || null;
    _state.currentTxs = _state.currentBatch?.transactions || [];
    if (!_state.currentBatch) {
      _state.selectedBatchId = 'all';
      _state.currentTxs = _state.batches.flatMap(b => b.transactions || []);
    }
  }

  APP().innerHTML = `
    <div class="app-shell">
      ${sidebarHTML(user, 'transactions')}
      <div class="main-content">
        ${headerHTML('Transactions Ledger', null, user)}
        <main class="page-body animate-fade-in">

          <div class="section">
            <div class="section-header">
              <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                <div>
                  <h2 class="section-title">All Evaluated Transactions</h2>
                  <p class="section-subtitle">${_state.currentTxs.length} total payment events ingested & scored</p>
                </div>
                ${_state.batches.length > 1 ? `
                  <select class="form-select" id="tx-batch-select" style="font-size:11px;padding:3px 24px 3px 8px;height:30px;max-width:260px">
                    <option value="all" ${_state.selectedBatchId === 'all' ? 'selected' : ''}>All Batches Combined (${_state.batches.flatMap(b => b.transactions || []).length} Tx)</option>
                    ${_state.batches.map(b => `
                      <option value="${b.id}" ${_state.selectedBatchId === b.id ? 'selected' : ''}>
                        ${esc(b.fileName || (b.type === 'single' ? 'Quick Single Check' : 'Batch'))} (${b.transactions?.length || 0} Tx)
                      </option>
                    `).join('')}
                  </select>
                ` : ''}
              </div>

              <div class="section-actions">
                <div class="model-toggle" role="group" aria-label="Select evaluation model">
                  <button class="model-toggle-btn${_state.modelType === 'classical' ? ' active' : ''}" id="tx-toggle-classical">Classical (XGBoost)</button>
                  <button class="model-toggle-btn quantum${_state.modelType === 'quantum' ? ' active' : ''}" id="tx-toggle-quantum">Quantum (VQC)</button>
                </div>
                <button class="btn btn-secondary btn-sm" id="tx-export-btn" ${_state.currentTxs.length === 0 ? 'disabled' : ''}>
                  ${icon('download', { size: 12 })} Export
                </button>
              </div>
            </div>

            <!-- Filter Controls -->
            <div class="filter-row" role="search" aria-label="Filter transactions">
              <div class="filter-search">
                <span class="filter-search-icon">${icon('search', { size: 13 })}</span>
                <input class="form-input" id="tx-search-input" type="search"
                  placeholder="Search merchant, location, card, or ID..." aria-label="Search transactions"
                  value="${esc(_state.filterSearch)}">
              </div>
              <select class="form-select" id="tx-risk-filter" aria-label="Filter by risk level" style="width:160px">
                <option value="all"    ${_state.filterRisk === 'all' ? 'selected' : ''}>All Risk Levels</option>
                <option value="high"   ${_state.filterRisk === 'high' ? 'selected' : ''}>High Risk (≥70%)</option>
                <option value="medium" ${_state.filterRisk === 'medium' ? 'selected' : ''}>Medium Risk (40-69%)</option>
                <option value="low"    ${_state.filterRisk === 'low' ? 'selected' : ''}>Low Risk (&lt;40%)</option>
              </select>
            </div>

            <!-- Table Container -->
            <div id="tx-table-container"></div>
            <div id="tx-pagination-container"></div>
          </div>

        </main>
      </div>
    </div>`;

  mountSidebarToggle();
  mountLogout(ctx);
  mountTxListeners(ctx);
  renderTable(ctx);
}

function filteredTxs() {
  let txs = _state.currentTxs;
  if (_state.filterSearch) {
    const q = _state.filterSearch.toLowerCase();
    txs = txs.filter(tx =>
      (tx.merchant || '').toLowerCase().includes(q) ||
      (tx.country || '').toLowerCase().includes(q) ||
      (tx.card_type || '').toLowerCase().includes(q) ||
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

function renderTable(ctx) {
  const tableContainer = document.getElementById('tx-table-container');
  const pageContainer = document.getElementById('tx-pagination-container');
  if (!tableContainer) return;

  const txs = filteredTxs();
  const total = txs.length;
  const pages = Math.max(1, Math.ceil(total / _state.pageSize));
  const page = Math.min(_state.page, pages);
  const start = (page - 1) * _state.pageSize;
  const pageTxs = txs.slice(start, start + _state.pageSize);

  const sortIcon = k => {
    if (_state.sortKey !== k) return `<span class="sort-icon">${icon('chevronDown', { size: 11 })}</span>`;
    return `<span class="sort-icon">${icon(_state.sortDir === 'asc' ? 'arrowUp' : 'arrowDown', { size: 11 })}</span>`;
  };
  const thCls = k => `sortable${_state.sortKey === k ? ` sorted-${_state.sortDir}` : ''}`;

  tableContainer.innerHTML = `
    <div class="table-wrap">
      <table class="data-table" aria-label="Transactions Ledger">
        <thead><tr>
          <th class="${thCls('date')}" data-sort="date">Timestamp${sortIcon('date')}</th>
          <th class="${thCls('merchant')}" data-sort="merchant">Merchant Entity${sortIcon('merchant')}</th>
          <th class="${thCls('amount')} text-right" data-sort="amount">Settlement (₹)${sortIcon('amount')}</th>
          <th>Instrument</th>
          <th>Routing</th>
          <th class="${thCls('score')} col-score" data-sort="score" style="text-align:center">Fraud Prob.${sortIcon('score')}</th>
          <th class="col-risk">Triage Assessment</th>
          <th class="col-status text-right">Action Status</th>
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
                <td class="muted mono">${esc(tx.date || '—')}</td>
                <td style="font-weight:600">${esc(tx.merchant || '—')}</td>
                <td class="mono text-right" style="font-weight:600">₹${Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="muted">${esc(tx.card_type || 'Visa')}</td>
                <td class="muted">${esc(tx.country || 'IN')}</td>
                <td class="col-score" style="text-align:center">
                  <span class="score-pill ${level}">${pct}%</span>
                </td>
                <td class="col-risk">
                  <span class="risk-indicator ${level}">
                    <span class="risk-dot"></span>${level === 'high' ? 'High Risk' : level === 'medium' ? 'Review' : 'Cleared'}
                  </span>
                </td>
                <td class="col-status text-right">
                  ${r?.flag ? `<span class="badge badge-high">${icon('alertTriangle', { size: 10 })} Action Required</span>` : `<span class="badge badge-low">${icon('check', { size: 10 })} Settle Clean</span>`}
                </td>
              </tr>`;
          }).join('')}
          ${pageTxs.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:36px;color:var(--c-text-3)">No transaction records matched your search query.</td></tr>` : ''}
        </tbody>
      </table>
    </div>`;

  if (pageContainer) {
    pageContainer.innerHTML = pages > 1 ? `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--sp-4);font-size:12px;color:var(--c-text-3)">
        <span>Showing ${start + 1}–${Math.min(start + _state.pageSize, total)} of ${total} records</span>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn btn-secondary btn-sm" id="tx-page-prev" ${page <= 1 ? 'disabled' : ''}>Previous</button>
          <span class="mono" style="padding:0 4px">Page ${page} / ${pages}</span>
          <button class="btn btn-secondary btn-sm" id="tx-page-next" ${page >= pages ? 'disabled' : ''}>Next</button>
        </div>
      </div>` : '';
  }

  // Sort click bindings
  tableContainer.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (_state.sortKey === key) {
        _state.sortDir = _state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        _state.sortKey = key;
        _state.sortDir = 'desc';
      }
      renderTable(ctx);
    });
  });

  document.getElementById('tx-page-prev')?.addEventListener('click', () => {
    if (_state.page > 1) { _state.page--; renderTable(ctx); }
  });
  document.getElementById('tx-page-next')?.addEventListener('click', () => {
    if (_state.page < pages) { _state.page++; renderTable(ctx); }
  });
}

function mountTxListeners(ctx) {
  document.getElementById('tx-batch-select')?.addEventListener('change', e => {
    _state.selectedBatchId = e.target.value;
    _state.page = 1;
    renderTransactionsScreen(ctx);
  });

  document.getElementById('tx-toggle-classical')?.addEventListener('click', () => {
    _state.modelType = 'classical';
    renderTransactionsScreen(ctx);
  });

  document.getElementById('tx-toggle-quantum')?.addEventListener('click', () => {
    _state.modelType = 'quantum';
    renderTransactionsScreen(ctx);
  });

  document.getElementById('tx-search-input')?.addEventListener('input', e => {
    _state.filterSearch = e.target.value;
    _state.page = 1;
    renderTable(ctx);
  });

  document.getElementById('tx-risk-filter')?.addEventListener('change', e => {
    _state.filterRisk = e.target.value;
    _state.page = 1;
    renderTable(ctx);
  });

  document.getElementById('tx-export-btn')?.addEventListener('click', () => {
    const txs = filteredTxs();
    window.showModal(`
      <h2 class="modal-title">Export Transactions Ledger</h2>
      <p class="modal-body">Export ${txs.length} transaction records as CSV or PDF report using ${_state.modelType === 'quantum' ? 'Quantum VQC' : 'Classical XGBoost'} scores.</p>
      <div class="modal-actions">
        <button class="btn btn-secondary btn-sm" id="m-cancel">Cancel</button>
        <button class="btn btn-primary btn-sm" id="m-csv">${icon('download', { size: 12 })} Export CSV</button>
        <button class="btn btn-primary btn-sm" id="m-pdf">${icon('download', { size: 12 })} Export PDF</button>
      </div>`, modal => {
      modal.querySelector('#m-cancel').addEventListener('click', window.closeModal);
      modal.querySelector('#m-csv').addEventListener('click', () => {
        try {
          exportToCSV(txs, 'cred_ai_ledger_export', _state.modelType);
          window.closeModal();
          window.showToast('CSV export downloaded.', 'success');
        } catch (e) { window.showToast(e.message, 'error'); }
      });
      modal.querySelector('#m-pdf').addEventListener('click', () => {
        try {
          exportToPDF(txs, 'cred_ai_ledger_report', {
            userName: ctx.user?.name,
            batchName: 'Transactions Ledger Audit',
            modelType: _state.modelType,
            exportedAt: new Date().toISOString(),
          });
          window.closeModal();
          window.showToast('PDF report generated.', 'success');
        } catch (e) { window.showToast(e.message, 'error'); }
      });
    });
  });
}

function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
