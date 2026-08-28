/**
 * history.js — History list and batch detail screens for [cred]
 */

import { Batches } from '../store.js';
import { getRiskLevel } from '../ml.js';
import { exportToCSV, exportToPDF } from '../export.js';
import { icon } from '../icons.js';
import { sidebarHTML, headerHTML, mountSidebarToggle, mountLogout } from '../app.js';
import { updateBell } from '../notifications.js';

const APP = () => document.getElementById('app');

export function renderHistory(batchId, ctx) {
  if (batchId) {
    renderBatchDetail(batchId, ctx);
  } else {
    renderHistoryList(ctx);
  }
}

/* ================================================================
   History List
================================================================ */
function renderHistoryList(ctx) {
  const { user } = ctx;
  const batches = Batches.list(user.id);

  APP().innerHTML = `
    <div class="app-shell">
      ${sidebarHTML(user, 'history')}
      <div class="main-content">
        ${headerHTML('Audit History', null, user)}
        <main class="page-body animate-fade-in">
          <div class="section">
            <div class="section-header">
              <div>
                <h2 class="section-title">Historical Ledgers & Runs</h2>
                <p class="section-subtitle">${batches.length} session${batches.length !== 1 ? 's' : ''} recorded</p>
              </div>
            </div>

            ${batches.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state-icon">${icon('clock', { size: 36 })}</div>
                <div class="empty-state-title">No triage history yet</div>
                <div class="empty-state-desc">Upload a CSV statement or execute a Quick Check on the Dashboard to build your ledger audit log.</div>
                <button class="btn btn-primary" style="margin-top:16px" onclick="navigate('/dashboard')">Go to Dashboard</button>
              </div>
            ` : `
              <div class="history-list" id="history-list">
                ${batches.map(b => historyItemHTML(b)).join('')}
              </div>
            `}
          </div>
        </main>
      </div>
    </div>`;

  mountSidebarToggle();
  mountLogout(ctx);
  mountHistoryActions(batches, ctx);
}

function historyItemHTML(batch) {
  const date     = formatDate(batch.uploadedAt);
  const txCount  = batch.transactions?.length || 0;
  const flagged  = batch.transactions?.filter(tx => tx.classical?.flag).length || 0;
  const typeIcon = batch.type === 'single' ? 'zap' : 'file';
  const typeLabel= batch.type === 'single' ? 'Single Check' : 'CSV Batch';
  const name     = batch.fileName || (batch.type === 'single' ? `Quick Check — ${date}` : 'Batch Ledger');

  return `
    <div class="history-item" data-batch-id="${batch.id}">
      <div class="history-item-icon">${icon(typeIcon, { size: 18 })}</div>
      <div class="history-item-body" onclick="navigate('/history/${batch.id}')" style="cursor:pointer;flex:1">
        <div class="history-item-name">${esc(name)}</div>
        <div class="history-item-meta">${typeLabel} · ${date} · ${txCount} transaction${txCount !== 1 ? 's' : ''}</div>
      </div>
      <div class="history-item-stats">
        ${flagged > 0 ? `<span class="history-item-flagged">${icon('alertTriangle', { size: 13 })} ${flagged} flagged</span>` : '<span style="font-size:12px;color:var(--c-low)">Clean</span>'}
        <span class="history-item-total">${txCount} total</span>
      </div>
      <div class="history-item-actions">
        <button class="btn btn-secondary btn-sm" data-action="open" title="Open batch details">Open</button>
        <button class="btn btn-secondary btn-sm" data-action="export" title="Export batch">${icon('download', { size: 13 })}</button>
        <button class="btn btn-danger-outline btn-sm" data-action="delete" title="Delete record">${icon('trash', { size: 13 })}</button>
      </div>
    </div>`;
}

function mountHistoryActions(batches, ctx) {
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const item    = btn.closest('[data-batch-id]');
      const batchId = item?.dataset.batchId;
      const batch   = batches.find(b => b.id === batchId);
      if (!batch) return;

      const action = btn.dataset.action;
      if (action === 'open')   ctx.navigate(`/history/${batchId}`);
      if (action === 'export') doExportBatch(batch, ctx.user);
      if (action === 'delete') confirmDelete(batch, ctx);
    });
  });
}

function confirmDelete(batch, ctx) {
  ctx.showModal(`
    <h2 class="modal-title">Delete Audit Ledger?</h2>
    <p class="modal-body">
      This will permanently delete <strong>${esc(batch.fileName || 'this record')}</strong>
      and all ${batch.transactions?.length || 0} associated transaction triage records.
      This action cannot be undone.
    </p>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="del-cancel">Cancel</button>
      <button class="btn btn-danger" id="del-confirm">${icon('trash', { size: 14 })} Delete</button>
    </div>`, modal => {
    modal.querySelector('#del-cancel').addEventListener('click', window.closeModal);
    modal.querySelector('#del-confirm').addEventListener('click', () => {
      Batches.delete(ctx.user.id, batch.id);
      window.closeModal();
      window.showToast('Batch ledger deleted.', 'info');
      updateBell(ctx.user.id);
      renderHistoryList(ctx);
    });
  });
}

/* ================================================================
   Batch Detail
================================================================ */
function renderBatchDetail(batchId, ctx) {
  const { user } = ctx;
  const batch = Batches.get(user.id, batchId);

  if (!batch) {
    APP().innerHTML = `
      <div class="app-shell">
        ${sidebarHTML(user, 'history')}
        <div class="main-content">
          ${headerHTML(null, `<a href="#/history">History</a><span class="breadcrumb-sep">${icon('chevronRight', { size: 12 })}</span>Not found`, user)}
          <main class="page-body">
            <div class="empty-state">
              <div class="empty-state-icon">${icon('search', { size: 36 })}</div>
              <div class="empty-state-title">Batch record not found</div>
              <div class="empty-state-desc">This ledger may have been deleted or belongs to another user profile.</div>
              <button class="btn btn-primary" style="margin-top:16px" onclick="navigate('/history')">Back to History</button>
            </div>
          </main>
        </div>
      </div>`;
    mountSidebarToggle();
    mountLogout(ctx);
    return;
  }

  const txs      = batch.transactions || [];
  const flagged  = txs.filter(tx => tx.classical?.flag).length;
  const name     = batch.fileName || (batch.type === 'single' ? 'Single Check' : 'Batch Ledger');
  let modelType  = 'classical';
  let sortKey    = 'score';
  let sortDir    = 'desc';
  let filterRisk = 'all';
  let filterQ    = '';
  let page       = 1;
  const pageSize = 25;

  function filteredSorted() {
    let list = [...txs];
    if (filterQ) {
      const q = filterQ.toLowerCase();
      list = list.filter(tx => (tx.merchant||'').toLowerCase().includes(q) || (tx.country||'').toLowerCase().includes(q));
    }
    if (filterRisk !== 'all') {
      list = list.filter(tx => getRiskLevel((tx[modelType]||tx.classical)?.score ?? 0) === filterRisk);
    }
    list.sort((a, b) => {
      const ra = a[modelType]||a.classical, rb = b[modelType]||b.classical;
      let va, vb;
      if (sortKey === 'score') { va = ra?.score??0; vb = rb?.score??0; }
      else if (sortKey === 'amount') { va = a.amount??0; vb = b.amount??0; }
      else if (sortKey === 'date') { va = a.date||''; vb = b.date||''; }
      else { va = 0; vb = 0; }
      return sortDir === 'asc' ? (va>vb?1:-1) : (va<vb?1:-1);
    });
    return list;
  }

  function mount() {
    mountSidebarToggle();
    mountLogout(ctx);

    document.getElementById('bd-classical')?.addEventListener('click', () => {
      modelType = 'classical';
      document.getElementById('bd-classical')?.classList.add('active');
      document.getElementById('bd-quantum')?.classList.remove('active');
      renderTable();
    });
    document.getElementById('bd-quantum')?.addEventListener('click', () => {
      modelType = 'quantum';
      document.getElementById('bd-quantum')?.classList.add('active', 'quantum');
      document.getElementById('bd-classical')?.classList.remove('active');
      renderTable();
    });

    document.getElementById('bd-export')?.addEventListener('click', () => doExportBatch(batch, user, modelType));
    document.getElementById('bd-delete')?.addEventListener('click', () => {
      confirmDelete(batch, { ...ctx, navigate: path => { window.closeModal(); ctx.navigate(path); } });
    });

    renderTable();
  }

  function renderTable() {
    const container = document.getElementById('bd-table');
    const pgContainer = document.getElementById('bd-pagination');
    if (!container) return;

    const list  = filteredSorted();
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    page = Math.min(page, pages);
    const start = (page - 1) * pageSize;
    const pageTxs = list.slice(start, start + pageSize);

    const sortIcon = k => {
      if (sortKey !== k) return `<span class="sort-icon">${icon('chevronDown', { size: 11 })}</span>`;
      return `<span class="sort-icon">${icon(sortDir === 'asc' ? 'arrowUp' : 'arrowDown', { size: 11 })}</span>`;
    };
    const thCls = k => `sortable${sortKey === k ? ` sorted-${sortDir}` : ''}`;

    const desktopTable = `
      <div class="table-wrap" id="bd-desktop" style="display:none">
        <table class="data-table">
          <thead><tr>
            <th class="${thCls('date')}" data-sort="date">Date${sortIcon('date')}</th>
            <th class="${thCls('merchant')}" data-sort="merchant">Merchant${sortIcon('merchant')}</th>
            <th class="${thCls('amount')} text-right" data-sort="amount">Amount${sortIcon('amount')}</th>
            <th>Country</th>
            <th class="${thCls('score')} col-score" data-sort="score" style="text-align:center">Fraud Score${sortIcon('score')}</th>
            <th class="col-risk">Risk Level</th>
            <th class="col-status">Status</th>
          </tr></thead>
          <tbody>
            ${pageTxs.map(tx => {
              const r = tx[modelType]||tx.classical;
              const pct = Math.round((r?.score??0)*100);
              const level = getRiskLevel(r?.score??0);
              return `<tr class="clickable${r?.flag?' flagged':''}" onclick="navigate('/transaction/${tx.id}')" role="link" tabindex="0">
                <td class="muted">${esc(tx.date||'—')}</td>
                <td style="font-weight:500">${esc(tx.merchant||'—')}</td>
                <td class="mono text-right">₹${Number(tx.amount||0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="muted">${esc(tx.country||'IN')}</td>
                <td class="col-score" style="text-align:center">
                  <span class="score-pill ${level}">${pct}%</span>
                </td>
                <td class="col-risk">
                  <span class="risk-indicator ${level}">
                    <span class="risk-dot"></span>${level === 'high' ? 'High Risk' : level === 'medium' ? 'Medium Risk' : 'Low Risk'}
                  </span>
                </td>
                <td class="col-status">
                  ${r?.flag ? `<span class="badge badge-high">${icon('alertTriangle', { size: 11 })} Flagged</span>` : `<span class="badge badge-low">${icon('check', { size: 11 })} Safe</span>`}
                </td>
              </tr>`;
            }).join('')}
            ${pageTxs.length===0?`<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--c-text-3)">No transactions match your filters.</td></tr>`:''}
          </tbody>
        </table>
      </div>`;

    const mobileCards = `
      <div class="table-wrap" id="bd-mobile" style="display:none">
        ${pageTxs.map(tx => {
          const r = tx[modelType]||tx.classical;
          const pct = Math.round((r?.score??0)*100);
          const level = getRiskLevel(r?.score??0);
          return `<div class="tx-card" onclick="navigate('/transaction/${tx.id}')" role="link" tabindex="0" style="padding:var(--sp-4);border-bottom:1px solid var(--c-border)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-weight:600">${esc(tx.merchant||'—')}</span>
              <span class="mono">₹${Number(tx.amount||0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--c-text-3)">
              <span>${esc(tx.date||'—')}</span>
              <span class="risk-indicator ${level}"><span class="risk-dot"></span>${pct}%</span>
            </div>
          </div>`;
        }).join('')}
      </div>`;

    container.innerHTML = desktopTable + mobileCards;
    pgContainer.innerHTML = pages > 1 ? renderPagination(page, pages, list.length) : '';

    applyResponsive('bd-desktop', 'bd-mobile');

    document.querySelectorAll('[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const k = th.dataset.sort;
        if (sortKey === k) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortKey = k; sortDir = 'desc'; }
        renderTable();
      });
    });
    document.querySelectorAll('.page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => { page = parseInt(btn.dataset.page, 10); renderTable(); });
    });
    document.getElementById('bd-search')?.addEventListener('input', e => { filterQ = e.target.value; page = 1; renderTable(); });
    document.getElementById('bd-risk-filter')?.addEventListener('change', e => { filterRisk = e.target.value; page = 1; renderTable(); });
  }

  APP().innerHTML = `
    <div class="app-shell">
      ${sidebarHTML(user, 'history')}
      <div class="main-content">
        ${headerHTML(null, `<a href="#/history">History</a><span class="breadcrumb-sep">${icon('chevronRight', { size: 12 })}</span><span style="color:var(--c-text-1)">${esc(name)}</span>`, user)}
        <main class="page-body animate-fade-in">

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Transactions</div>
              <div class="stat-value">${txs.length.toLocaleString('en-IN')}</div>
              <div class="stat-sub">${formatDate(batch.uploadedAt)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Flagged Records</div>
              <div class="stat-value" style="color:${flagged?'var(--c-high)':'inherit'}">${flagged}</div>
              <div class="stat-sub">potential fraud</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Fraud Velocity</div>
              <div class="stat-value">${txs.length ? Math.round(flagged/txs.length*100) : 0}%</div>
              <div class="stat-sub">${batch.type === 'single' ? 'Single Check' : 'CSV Batch'}</div>
            </div>
          </div>

          <section class="section">
            <div class="section-header">
              <h2 class="section-title">Transactions</h2>
              <div class="section-actions">
                <div class="model-toggle" role="group">
                  <button class="model-toggle-btn active" id="bd-classical">Classical</button>
                  <button class="model-toggle-btn quantum" id="bd-quantum">Quantum</button>
                </div>
                <button class="btn btn-secondary btn-sm" id="bd-export">${icon('download', { size: 13 })} Export</button>
                <button class="btn btn-danger-outline btn-sm" id="bd-delete">${icon('trash', { size: 13 })} Delete</button>
              </div>
            </div>

            <div class="filter-row">
              <div class="filter-search">
                <span class="filter-search-icon">${icon('search', { size: 14 })}</span>
                <input class="form-input" id="bd-search" type="search" placeholder="Search merchant, country…">
              </div>
              <select class="form-select" id="bd-risk-filter" style="width:150px">
                <option value="all">All risk levels</option>
                <option value="high">High risk (≥70%)</option>
                <option value="medium">Medium risk (40-69%)</option>
                <option value="low">Low risk (&lt;40%)</option>
              </select>
            </div>

            <div id="bd-table"></div>
            <div id="bd-pagination"></div>
          </section>

        </main>
      </div>
    </div>`;

  mount();
  window.addEventListener('resize', () => applyResponsive('bd-desktop', 'bd-mobile'));
}

function doExportBatch(batch, user, modelType = 'classical') {
  const txs = batch.transactions || [];
  if (!txs.length) { window.showToast('No transactions to export.', 'warning'); return; }
  window.showModal(`
    <h2 class="modal-title">Export Batch Ledger</h2>
    <p class="modal-body">${txs.length.toLocaleString('en-IN')} transaction records will be exported.</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="m-cancel">Cancel</button>
      <button class="btn btn-primary" id="m-csv">${icon('download', { size: 14 })} CSV</button>
      <button class="btn btn-primary" id="m-pdf">${icon('download', { size: 14 })} PDF Report</button>
    </div>`, modal => {
    modal.querySelector('#m-cancel').addEventListener('click', window.closeModal);
    modal.querySelector('#m-csv').addEventListener('click', () => {
      try { exportToCSV(txs, `cred_batch_${batch.id}`, modelType); window.closeModal(); window.showToast('CSV downloaded.', 'success'); }
      catch(e) { window.showToast(e.message, 'error'); }
    });
    modal.querySelector('#m-pdf').addEventListener('click', () => {
      try {
        exportToPDF(txs, `cred_report_${batch.id}`, { userName: user?.name, batchName: batch.fileName, modelType, exportedAt: new Date().toISOString() });
        window.closeModal(); window.showToast('PDF report downloaded.', 'success');
      } catch(e) { window.showToast(e.message, 'error'); }
    });
  });
}

function renderPagination(page, pages, total) {
  const start = Math.max(1, page-2), end = Math.min(pages, page+2);
  let h = `<div class="pagination">
    <button class="page-btn" data-page="${page-1}" ${page===1?'disabled':''}>${icon('chevronDown', { size: 11, className: 'rotate-90' })}</button>`;
  for (let p = start; p <= end; p++) h += `<button class="page-btn${p===page?' active':''}" data-page="${p}">${p}</button>`;
  h += `<button class="page-btn" data-page="${page+1}" ${page===pages?'disabled':''}>${icon('chevronDown', { size: 11, className: 'rotate-270' })}</button>
    <span class="page-info">${total.toLocaleString('en-IN')} results</span></div>`;
  return h;
}

function applyResponsive(desktopId, mobileId) {
  const d = document.getElementById(desktopId);
  const m = document.getElementById(mobileId);
  if (!d || !m) return;
  const narrow = window.innerWidth < 700;
  d.style.display = narrow ? 'none' : 'block';
  m.style.display = narrow ? 'block' : 'none';
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-IN', { month:'short', day:'numeric', year:'numeric' }); } catch { return iso; }
}
function esc(s) { return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
