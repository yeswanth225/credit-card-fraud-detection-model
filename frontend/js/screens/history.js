/**
 * history.js — Audit Trail & Session History for cred ai
 */

import { Batches } from '../store.js';
import { exportToCSV, exportToPDF } from '../export.js';
import { icon } from '../icons.js';
import { sidebarHTML, headerHTML, mountSidebarToggle, mountLogout } from '../app.js';

const APP = () => document.getElementById('app');

export function renderHistory(batchId, ctx) {
  const { user } = ctx;
  const batches = Batches.list(user.id);

  APP().innerHTML = `
    <div class="app-shell">
      ${sidebarHTML(user, 'history')}
      <div class="main-content">
        ${headerHTML('Audit Trail & History', null, user)}
        <main class="page-body animate-fade-in">
          <div class="section">
            <div class="section-header">
              <div>
                <h2 class="section-title">Ingestion & Triage Audit Ledger</h2>
                <p class="section-subtitle">Chronological record of all transaction batch processing and individual triage checks</p>
              </div>
            </div>

            ${batches.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state-icon">${icon('clock', { size: 32 })}</div>
                <div class="empty-state-title">No audit history found</div>
                <div class="empty-state-desc">Evaluate transactions via Quick Check or CSV upload to generate audit trail entries.</div>
              </div>
            ` : `
              <div class="history-list">
                ${batches.map(b => batchItemHTML(b)).join('')}
              </div>
            `}
          </div>
        </main>
      </div>
    </div>`;

  mountSidebarToggle();
  mountLogout(ctx);
  mountHistoryActions(ctx);
}

function batchItemHTML(b) {
  const txs = b.transactions || [];
  const flagged = txs.filter(t => (t.classical || t.quantum)?.flag).length;
  const isSingle = b.type === 'single';

  return `
    <div class="history-item" data-batch-id="${b.id}">
      <div class="history-item-icon">
        ${icon(isSingle ? 'zap' : 'file', { size: 16 })}
      </div>
      <div class="history-item-body">
        <div class="history-item-name">
          ${esc(b.fileName || (isSingle ? `Quick Check (${txs[0]?.merchant || 'Transaction'})` : 'Batch Upload'))}
        </div>
        <div class="history-item-meta">
          <span>${new Date(b.createdAt).toLocaleString('en-IN')}</span> ·
          <span>${txs.length} record${txs.length !== 1 ? 's' : ''}</span> ·
          <span style="color:${flagged ? 'var(--c-high)' : 'var(--c-low)'}">${flagged} flagged</span>
        </div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="btn btn-secondary btn-sm btn-batch-export" data-batch-id="${b.id}" title="Export records">
          ${icon('download', { size: 11 })} Export
        </button>
        <button class="btn btn-ghost btn-sm btn-batch-delete" data-batch-id="${b.id}" title="Delete batch" style="color:var(--c-high)">
          ${icon('trash', { size: 11 })}
        </button>
      </div>
    </div>`;
}

function mountHistoryActions(ctx) {
  const { user } = ctx;

  document.querySelectorAll('.btn-batch-export').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const batchId = btn.dataset.batchId;
      const b = Batches.get(user.id, batchId);
      if (!b) return;
      exportToCSV(b.transactions || [], `cred_ai_batch_${b.id}`, 'classical');
      window.showToast('Batch CSV downloaded.', 'success');
    });
  });

  document.querySelectorAll('.btn-batch-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const batchId = btn.dataset.batchId;
      window.showModal(`
        <h2 class="modal-title">Delete Audit Batch</h2>
        <p class="modal-body">Are you sure you want to delete this batch and its transaction logs? This action cannot be undone.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary btn-sm" id="m-cancel">Cancel</button>
          <button class="btn btn-danger btn-sm" id="m-confirm">${icon('trash', { size: 12 })} Delete Record</button>
        </div>`, modal => {
        modal.querySelector('#m-cancel').addEventListener('click', window.closeModal);
        modal.querySelector('#m-confirm').addEventListener('click', () => {
          Batches.delete(user.id, batchId);
          window.closeModal();
          window.showToast('Batch deleted.', 'info');
          renderHistory(null, ctx);
        });
      });
    });
  });
}

function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
