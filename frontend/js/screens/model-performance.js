/**
 * model-performance.js — Machine Learning & Quantum Intelligence Benchmark Workspace for cred ai
 *
 * METRICS SOURCE (do not modify without re-running benchmarks):
 *   Classical XGBoost: data/processed/phase1_results.json
 *   Quantum QSVC/VQC:  phase2/results/phase2_benchmark_final.json (run 2026-08-31)
 */

import { icon } from '../icons.js';
import { sidebarHTML, headerHTML, mountSidebarToggle, mountLogout } from '../app.js';

const APP = () => document.getElementById('app');

export function renderModelPerformance(ctx) {
  const { user } = ctx;

  APP().innerHTML = `
    <div class="app-shell">
      ${sidebarHTML(user, 'model-performance')}
      <div class="main-content">
        ${headerHTML('Model Performance & Benchmarks', null, user)}
        <main class="page-body animate-fade-in">

          <div class="section-header" style="margin-bottom:var(--sp-6)">
            <div>
              <div style="font-size:10px;font-weight:700;color:var(--c-quantum);text-transform:uppercase;letter-spacing:0.05em">
                ML Architecture & Benchmark Evaluation
              </div>
              <h2 class="section-title">Classical vs Quantum Detection Models</h2>
              <p class="section-subtitle">Verified results — classical on 284,807 transactions, quantum on a 100-sample local simulation subset</p>
            </div>
            <div class="section-actions">
              <span class="badge badge-neutral" style="font-family:var(--font-mono)">Classical: 284,807 Tx</span>
              <span class="badge badge-quantum" style="font-family:var(--font-mono)">Quantum: 100 samples · Qiskit Statevector</span>
            </div>
          </div>

          <!-- 1. XGBoost Key Metrics (verified from phase1_results.json) -->
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:var(--sp-4);margin-bottom:var(--sp-4)">
            <div style="padding:var(--sp-4);background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--r-lg)">
              <div style="font-size:11px;color:var(--c-text-3);text-transform:uppercase;font-weight:700">XGBoost ROC-AUC</div>
              <div style="font-size:26px;font-weight:800;font-family:var(--font-mono);color:var(--c-text-1);margin:4px 0">0.9692</div>
              <div style="font-size:11px;color:var(--c-low)">Primary classical baseline</div>
            </div>
            <div style="padding:var(--sp-4);background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--r-lg)">
              <div style="font-size:11px;color:var(--c-text-3);text-transform:uppercase;font-weight:700">XGBoost PR-AUC</div>
              <div style="font-size:26px;font-weight:800;font-family:var(--font-mono);color:var(--c-text-1);margin:4px 0">0.8716</div>
              <div style="font-size:11px;color:var(--c-low)">Imbalance-aware primary metric</div>
            </div>
            <div style="padding:var(--sp-4);background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--r-lg)">
              <div style="font-size:11px;color:var(--c-text-3);text-transform:uppercase;font-weight:700">XGBoost F1 Score</div>
              <div style="font-size:26px;font-weight:800;font-family:var(--font-mono);color:var(--c-text-1);margin:4px 0">0.8723</div>
              <div style="font-size:11px;color:var(--c-low)">56,962 test transactions</div>
            </div>
            <div style="padding:var(--sp-4);background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--r-lg)">
              <div style="font-size:11px;color:var(--c-text-3);text-transform:uppercase;font-weight:700">XGBoost Recall</div>
              <div style="font-size:26px;font-weight:800;font-family:var(--font-mono);color:var(--c-text-1);margin:4px 0">83.7%</div>
              <div style="font-size:11px;color:var(--c-low)">Fraud cases caught</div>
            </div>
          </div>

          <!-- Quantum Experimental Context Banner -->
          <div style="padding:var(--sp-3) var(--sp-4);background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.25);border-radius:var(--r-md);margin-bottom:var(--sp-6)">
            <div style="display:flex;align-items:flex-start;gap:var(--sp-2)">
              ${icon('info', { size: 14 })}
              <div style="font-size:12px;color:var(--c-text-2);line-height:1.6">
                <strong>Quantum Experimental Context:</strong> QSVC and VQC results were produced using
                <strong>local Qiskit Statevector simulation</strong> (ideal, noiseless) on a
                <strong>100-sample balanced subset</strong> (50 fraud + 50 legitimate) with
                <strong>4 features</strong> (V14, V4, V12, V8). IBM Quantum hardware is not integrated.
                The test set had only 1 fraud case in 25 samples, making precision/recall/F1
                statistically unreliable at this scale.
                <strong>These results show the quantum pipeline works — not that it outperforms XGBoost.</strong>
              </div>
            </div>
          </div>

          <!-- 2. Benchmark Comparison Table -->
          <div class="section">
            <div class="section-header" style="margin-bottom:var(--sp-3)">
              <h3 class="section-title" style="font-size:15px">Benchmark Matrix</h3>
            </div>
            <div class="table-wrap">
              <table class="data-table" aria-label="Model Comparison">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Type</th>
                    <th class="text-right">Train Samples</th>
                    <th class="text-right">Features</th>
                    <th class="text-right">ROC-AUC</th>
                    <th class="text-right">PR-AUC</th>
                    <th class="text-right">Recall</th>
                    <th class="text-right">Precision</th>
                    <th class="text-right">F1</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background:var(--c-surface-hover)">
                    <td style="font-weight:700">XGBoost (Phase 1 Baseline)</td>
                    <td><span class="badge badge-classical">Classical</span></td>
                    <td class="mono text-right">227,845</td>
                    <td class="mono text-right">30</td>
                    <td class="mono text-right" style="font-weight:700;color:var(--c-low)">0.9692</td>
                    <td class="mono text-right" style="font-weight:700;color:var(--c-low)">0.8716</td>
                    <td class="mono text-right">83.7%</td>
                    <td class="mono text-right">91.1%</td>
                    <td class="mono text-right">0.8723</td>
                  </tr>
                  <tr style="background:var(--c-quantum-bg)">
                    <td style="font-weight:700;color:var(--c-quantum)">
                      QSVC (ZZFeatureMap) ⚗️
                      <div style="font-size:10px;color:var(--c-text-3);font-weight:400;margin-top:2px">Experimental · 100 samples · 4 qubits · local sim · 1 fraud in test</div>
                    </td>
                    <td><span class="badge badge-quantum">Quantum Kernel</span></td>
                    <td class="mono text-right">100</td>
                    <td class="mono text-right">4</td>
                    <td class="mono text-right" style="color:var(--c-text-3)">0.0833</td>
                    <td class="mono text-right" style="color:var(--c-text-3)">0.0435</td>
                    <td class="mono text-right" style="color:var(--c-text-3)">0.0%</td>
                    <td class="mono text-right" style="color:var(--c-text-3)">—</td>
                    <td class="mono text-right" style="color:var(--c-text-3)">0.0000</td>
                  </tr>
                  <tr style="background:var(--c-quantum-bg)">
                    <td style="font-weight:700;color:var(--c-quantum)">
                      VQC (RealAmplitudes) ⚗️
                      <div style="font-size:10px;color:var(--c-text-3);font-weight:400;margin-top:2px">Experimental · 100 samples · 4 qubits · local sim · 1 fraud in test</div>
                    </td>
                    <td><span class="badge badge-quantum">Variational Ansatz</span></td>
                    <td class="mono text-right">100</td>
                    <td class="mono text-right">4</td>
                    <td class="mono text-right" style="color:var(--c-quantum)">0.7083</td>
                    <td class="mono text-right" style="color:var(--c-quantum)">0.1250</td>
                    <td class="mono text-right">100%*</td>
                    <td class="mono text-right">10.0%</td>
                    <td class="mono text-right">0.1818</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style="font-size:11px;color:var(--c-text-3);margin-top:var(--sp-2);line-height:1.6">
              * VQC Recall = 100% / Precision = 10% means it flagged nearly all 25 test samples as fraud to catch the 1 true case.
              Classical and quantum results use fundamentally different dataset sizes — they are <strong>not a fair head-to-head comparison</strong>.
              The quantum benchmark demonstrates pipeline feasibility, not production performance.
            </p>
          </div>

          <!-- 3. Quantum Circuit -->
          <div class="section">
            <div class="section-header" style="margin-bottom:var(--sp-3)">
              <h3 class="section-title" style="font-size:15px;display:flex;align-items:center;gap:6px">
                ${icon('cpu', { size: 15 })} 4-Qubit ZZFeatureMap Circuit (reps=2)
              </h3>
              <p class="section-subtitle">Features V14, V4, V12, V8 scaled to [−π, π] and encoded as quantum states</p>
            </div>
            <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--r-lg);padding:var(--sp-5);font-family:var(--font-mono);font-size:12px;color:var(--c-text-1);overflow-x:auto">
              <div style="line-height:2.2;letter-spacing:0.02em">
                <div><span style="color:var(--c-quantum);font-weight:700">q[0] (V14):</span> ──[ H ]──[ Rz(x₀) ]────■────────────■────────────[ H ]──[ Rz(x₀) ]──</div>
                <div><span style="color:var(--c-quantum);font-weight:700">q[1] (V4 ):</span> ──[ H ]──[ Rz(x₁) ]────┼───■────────┼───■────────[ H ]──[ Rz(x₁) ]──</div>
                <div><span style="color:var(--c-quantum);font-weight:700">q[2] (V12):</span> ──[ H ]──[ Rz(x₂) ]────┼───┼───■────┼───┼───■────[ H ]──[ Rz(x₂) ]──</div>
                <div><span style="color:var(--c-quantum);font-weight:700">q[3] (V8 ):</span> ──[ H ]──[ Rz(x₃) ]────■───■───■────■───■───■────[ H ]──[ Rz(x₃) ]──</div>
              </div>
              <div style="margin-top:var(--sp-4);padding-top:var(--sp-3);border-top:1px solid var(--c-border);font-size:11px;color:var(--c-text-3);font-family:var(--font-sans)">
                <strong>Circuit Details:</strong> 4 Qubits · ZZFeatureMap reps=2 · VQC ansatz: RealAmplitudes reps=2 (12 trainable params) ·
                Optimizer: COBYLA (max_iter=20) · Backend: Qiskit Statevector (ideal, noiseless) · IBM Quantum: NOT integrated
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>`;

  mountSidebarToggle();
  mountLogout(ctx);
}
