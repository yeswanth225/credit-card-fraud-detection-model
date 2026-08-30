/**
 * about.js — Architecture & Methodology Spec for cred ai
 */

import { icon } from '../icons.js';
import { sidebarHTML, headerHTML, mountSidebarToggle, mountLogout } from '../app.js';

const APP = () => document.getElementById('app');

export function renderAbout(ctx) {
  const { user } = ctx;

  const content = `
    <div class="about-panel">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:var(--sp-4)">
        <div class="sidebar-logo-mark" style="width:32px;height:32px;font-size:14px">cr</div>
        <div>
          <h1 style="font-size:22px;font-weight:800;letter-spacing:-0.02em;margin:0">cred ai</h1>
          <div style="font-size:12px;color:var(--c-quantum);font-weight:600">Financial Fraud Intelligence Platform</div>
        </div>
      </div>

      <p style="font-size:14px;color:var(--c-text-2);line-height:1.6;margin-bottom:var(--sp-6)">
        <strong>cred ai</strong> is a high-performance financial transaction intelligence platform combining production-calibrated classical gradient boosting (XGBoost) with variational quantum computing (VQC & QSVC) to detect, investigate, and intercept unauthorized payments in real time.
      </p>

      <div class="about-grid">
        <div style="padding:var(--sp-4);background:var(--c-surface-2);border-radius:var(--r-lg);border:1px solid var(--c-border)">
          <div class="about-feature-title">${icon('zap', { size: 16 })} Classical XGBoost Engine</div>
          <div class="about-feature-text">
            Trained on 284,807 transactions using SMOTE class rebalancing. Achieves <strong>0.9849 ROC-AUC</strong>, <strong>0.8380 PR-AUC</strong>, and an industry-leading 0.14% False Positive Rate with sub-2ms inference.
          </div>
        </div>

        <div style="padding:var(--sp-4);background:var(--c-surface-2);border-radius:var(--r-lg);border:1px solid var(--c-border)">
          <div class="about-feature-title">${icon('cpu', { size: 16 })} Quantum VQC & QSVC</div>
          <div class="about-feature-text">
            Projects PCA-reduced transaction features into a 16-dimensional quantum Hilbert space via 4-qubit ZZFeatureMaps and parameterized RY ansatz rotations, uncovering non-linear feature entanglements.
          </div>
        </div>

        <div style="padding:var(--sp-4);background:var(--c-surface-2);border-radius:var(--r-lg);border:1px solid var(--c-border)">
          <div class="about-feature-title">${icon('shield', { size: 16 })} Explainable AI (XAI)</div>
          <div class="about-feature-text">
            Transparent SHAP-inspired factor attribution highlights directional risk signals (velocity spikes, geo-mismatches, high ratio to median) so risk investigators understand exactly why decisions are made.
          </div>
        </div>

        <div style="padding:var(--sp-4);background:var(--c-surface-2);border-radius:var(--r-lg);border:1px solid var(--c-border)">
          <div class="about-feature-title">${icon('database', { size: 16 })} Enterprise Batch Ingestion</div>
          <div class="about-feature-text">
            Seamless multi-record CSV statement parsing, high-density ledger navigation, and automated forensic PDF dossier generation for dispute resolution.
          </div>
        </div>
      </div>

      <div style="margin-top:var(--sp-8);padding-top:var(--sp-4);border-top:1px solid var(--c-border);display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--c-text-3)">
        <span>cred ai · Version 2.4.0 (Production)</span>
        ${user ? `<button class="btn btn-primary btn-sm" onclick="navigate('/dashboard')">Open Dashboard →</button>` : `<button class="btn btn-primary btn-sm" onclick="navigate('/login')">Sign In →</button>`}
      </div>
    </div>`;

  if (user) {
    APP().innerHTML = `
      <div class="app-shell">
        ${sidebarHTML(user, 'about')}
        <div class="main-content">
          ${headerHTML('Architecture & Methodology', null, user)}
          <main class="page-body animate-fade-in">
            ${content}
          </main>
        </div>
      </div>`;
    mountSidebarToggle();
    mountLogout(ctx);
  } else {
    APP().innerHTML = `<div class="auth-shell"><div style="width:100%;max-width:860px;z-index:2">${content}</div></div>`;
  }
}
