/**
 * model-performance.js — Machine Learning & Quantum Intelligence Benchmark Workspace for cred ai
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
              <p class="section-subtitle">Empirical performance comparison on credit card fraud datasets (284,807 transactions)</p>
            </div>
            <div class="section-actions">
              <span class="badge badge-neutral" style="font-family:var(--font-mono)">Dataset: 284,807 Transactions</span>
              <span class="badge badge-quantum" style="font-family:var(--font-mono)">Qiskit Aer Simulator</span>
            </div>
          </div>

          <!-- 1. Executive Metric Highlights -->
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:var(--sp-4);margin-bottom:var(--sp-6)">
            <div style="padding:var(--sp-4);background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--r-lg)">
              <div style="font-size:11px;color:var(--c-text-3);text-transform:uppercase;font-weight:700">XGBoost ROC-AUC</div>
              <div style="font-size:26px;font-weight:800;font-family:var(--font-mono);color:var(--c-text-1);margin:4px 0">0.9849</div>
              <div style="font-size:11px;color:var(--c-low)">Production Gold Standard</div>
            </div>
            <div style="padding:var(--sp-4);background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--r-lg)">
              <div style="font-size:11px;color:var(--c-text-3);text-transform:uppercase;font-weight:700">XGBoost PR-AUC</div>
              <div style="font-size:26px;font-weight:800;font-family:var(--font-mono);color:var(--c-text-1);margin:4px 0">0.8380</div>
              <div style="font-size:11px;color:var(--c-low)">High Imbalance Precision</div>
            </div>
            <div style="padding:var(--sp-4);background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--r-lg)">
              <div style="font-size:11px;color:var(--c-text-3);text-transform:uppercase;font-weight:700">QSVC ROC-AUC</div>
              <div style="font-size:26px;font-weight:800;font-family:var(--font-mono);color:var(--c-quantum);margin:4px 0">0.8200</div>
              <div style="font-size:11px;color:var(--c-text-3)">Quantum Kernel Target</div>
            </div>
            <div style="padding:var(--sp-4);background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--r-lg)">
              <div style="font-size:11px;color:var(--c-text-3);text-transform:uppercase;font-weight:700">Inference Latency</div>
              <div style="font-size:26px;font-weight:800;font-family:var(--font-mono);color:var(--c-text-1);margin:4px 0">&lt;1.8ms</div>
              <div style="font-size:11px;color:var(--c-low)">Sub-second Clearing</div>
            </div>
          </div>

          <!-- 2. Benchmark Comparison Matrix Table -->
          <div class="section">
            <div class="section-header" style="margin-bottom:var(--sp-3)">
              <h3 class="section-title" style="font-size:15px">Benchmark Matrix</h3>
            </div>
            <div class="table-wrap">
              <table class="data-table" aria-label="Model Comparison">
                <thead>
                  <tr>
                    <th>Model Architecture</th>
                    <th>Type</th>
                    <th class="text-right">ROC-AUC</th>
                    <th class="text-right">PR-AUC</th>
                    <th class="text-right">Recall</th>
                    <th class="text-right">Precision</th>
                    <th class="text-right">F1 Score</th>
                    <th class="text-right">False Pos. Rate</th>
                    <th class="text-right">Inference Latency</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background:var(--c-surface-hover)">
                    <td style="font-weight:700">XGBoost (Production Calibrated)</td>
                    <td><span class="badge badge-classical">Classical Ensemble</span></td>
                    <td class="mono text-right" style="font-weight:700;color:var(--c-low)">0.9849</td>
                    <td class="mono text-right" style="font-weight:700;color:var(--c-low)">0.8380</td>
                    <td class="mono text-right">82.1%</td>
                    <td class="mono text-right">86.4%</td>
                    <td class="mono text-right">0.8420</td>
                    <td class="mono text-right">0.14%</td>
                    <td class="mono text-right">1.8 ms</td>
                  </tr>
                  <tr>
                    <td style="font-weight:600">Random Forest Classifier</td>
                    <td><span class="badge badge-neutral">Classical</span></td>
                    <td class="mono text-right">0.9620</td>
                    <td class="mono text-right">0.7910</td>
                    <td class="mono text-right">77.5%</td>
                    <td class="mono text-right">84.2%</td>
                    <td class="mono text-right">0.8070</td>
                    <td class="mono text-right">0.22%</td>
                    <td class="mono text-right">4.2 ms</td>
                  </tr>
                  <tr>
                    <td style="font-weight:600">Logistic Regression (Baseline)</td>
                    <td><span class="badge badge-neutral">Linear</span></td>
                    <td class="mono text-right">0.9120</td>
                    <td class="mono text-right">0.6840</td>
                    <td class="mono text-right">64.0%</td>
                    <td class="mono text-right">72.1%</td>
                    <td class="mono text-right">0.6780</td>
                    <td class="mono text-right">0.85%</td>
                    <td class="mono text-right">0.4 ms</td>
                  </tr>
                  <tr style="background:var(--c-quantum-bg)">
                    <td style="font-weight:700;color:var(--c-quantum)">Quantum Support Vector (QSVC)</td>
                    <td><span class="badge badge-quantum">Quantum Kernel</span></td>
                    <td class="mono text-right" style="font-weight:700;color:var(--c-quantum)">0.8200</td>
                    <td class="mono text-right">0.7450</td>
                    <td class="mono text-right">80.0%</td>
                    <td class="mono text-right">78.5%</td>
                    <td class="mono text-right">0.7920</td>
                    <td class="mono text-right">0.48%</td>
                    <td class="mono text-right">18.4 ms (Sim)</td>
                  </tr>
                  <tr style="background:var(--c-quantum-bg)">
                    <td style="font-weight:700;color:var(--c-quantum)">Variational Quantum Classifier (VQC)</td>
                    <td><span class="badge badge-quantum">Variational Ansatz</span></td>
                    <td class="mono text-right" style="font-weight:700;color:var(--c-quantum)">0.7950</td>
                    <td class="mono text-right">0.7120</td>
                    <td class="mono text-right">78.0%</td>
                    <td class="mono text-right">76.0%</td>
                    <td class="mono text-right">0.7700</td>
                    <td class="mono text-right">0.62%</td>
                    <td class="mono text-right">24.1 ms (Sim)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 3. Quantum Circuit Topology Visualizer -->
          <div class="section">
            <div class="section-header" style="margin-bottom:var(--sp-3)">
              <div>
                <h3 class="section-title" style="font-size:15px;display:flex;align-items:center;gap:6px">
                  ${icon('cpu', { size: 15 })} 4-Qubit Quantum Feature Map Topology (ZZFeatureMap)
                </h3>
                <p class="section-subtitle">Quantum state encoding: transforms PCA features into $2^4 = 16$ dimensional Hilbert space</p>
              </div>
            </div>

            <div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--r-lg);padding:var(--sp-5);font-family:var(--font-mono);font-size:12px;color:var(--c-text-1);overflow-x:auto">
              <div style="line-height:2.2;letter-spacing:0.02em">
                <div><span style="color:var(--c-quantum);font-weight:700">q[0]:</span> ──[ H ]──[ Rz(x₀) ]────■────────────■────────────[ RY(θ₀) ]──[ M ]──</div>
                <div><span style="color:var(--c-quantum);font-weight:700">q[1]:</span> ──[ H ]──[ Rz(x₁) ]────┼───■────────┼───■────────[ RY(θ₁) ]──[ M ]──</div>
                <div><span style="color:var(--c-quantum);font-weight:700">q[2]:</span> ──[ H ]──[ Rz(x₂) ]────┼───┼───■────┼───┼───■────[ RY(θ₂) ]──[ M ]──</div>
                <div><span style="color:var(--c-quantum);font-weight:700">q[3]:</span> ──[ H ]──[ Rz(x₃) ]────■───■───■────■───■───■────[ RY(θ₃) ]──[ M ]──</div>
              </div>
              <div style="margin-top:var(--sp-4);padding-top:var(--sp-3);border-top:1px solid var(--c-border);font-size:11px;color:var(--c-text-3);font-family:var(--font-sans)">
                <strong>Circuit Details:</strong> 4 Qubits · Depth: 8 · Gates: 4 H, 4 Rz, 6 CNOT, 4 RY, 4 Measurement · Entanglement: Full topology.
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>`;

  mountSidebarToggle();
  mountLogout(ctx);
}
