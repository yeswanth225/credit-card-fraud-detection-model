/**
 * about.js — About [cred] overview screen explaining classical & quantum hybrid triage
 */

import { icon } from '../icons.js';
import { sidebarHTML, headerHTML, mountSidebarToggle, mountLogout } from '../app.js';

const APP = () => document.getElementById('app');

export function renderAbout(ctx) {
  const { user } = ctx;

  APP().innerHTML = `
    <div class="app-shell">
      ${sidebarHTML(user, 'about')}
      <div class="main-content">
        ${headerHTML('About [cred]', null, user)}
        <main class="page-body animate-fade-in">

          <div class="about-card">
            <div class="about-header">
              <div class="auth-logo" style="margin-bottom:var(--sp-4)">
                <div class="auth-logo-mark">cr</div>
                <span class="auth-brand">[cred]</span>
              </div>
              <h2 class="about-title">Smart, Explainable Fraud Detection</h2>
              <p class="about-subtitle">
                [cred] is a high-precision transaction triage platform combining industry-standard classical machine learning with cutting-edge quantum algorithms to deliver transparent, reliable risk assessments.
              </p>
            </div>

            <div class="about-grid">
              <!-- Classical Engine -->
              <div class="about-feature">
                <div class="about-feature-title">
                  ${icon('shield', { size: 18 })}
                  Classical ML (XGBoost)
                </div>
                <div class="about-feature-text">
                  Optimized gradient boosted decision trees trained on millions of historical payment events. Highly efficient at detecting recognized tabular fraud patterns, velocity anomalies, and geographic discrepancies.
                </div>
              </div>

              <!-- Quantum Engine -->
              <div class="about-feature">
                <div class="about-feature-title">
                  ${icon('zap', { size: 18 })}
                  Quantum ML (VQC / QSVM)
                </div>
                <div class="about-feature-text">
                  Variational Quantum Classifiers and Quantum Support Vector Machines mapping transaction vectors into high-dimensional Hilbert spaces to identify subtle, multi-variable correlation attacks that evade classical boundaries.
                </div>
              </div>

              <!-- Explainability -->
              <div class="about-feature">
                <div class="about-feature-title">
                  ${icon('scale', { size: 18 })}
                  Trust & Explainability
                </div>
                <div class="about-feature-text">
                  Every flagged score comes with a clear plain-language rationale and directional feature-attribution breakdown (SHAP-inspired), enabling human analysts to audit verdicts in seconds.
                </div>
              </div>

              <!-- Adaptive Learning -->
              <div class="about-feature">
                <div class="about-feature-title">
                  ${icon('trendingUp', { size: 18 })}
                  Adaptive Pattern Calibration
                </div>
                <div class="about-feature-text">
                  Dynamic recalibration updates feature weights as fraud vectors evolve, ensuring decision rules remain effective against emerging payment schemes without manual heuristic overhauls.
                </div>
              </div>
            </div>

            <div style="margin-top:var(--sp-8);padding-top:var(--sp-6);border-top:1px solid var(--c-border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
              <span style="font-size:12px;color:var(--c-text-3)">Version 2.1 — Built for secure financial operations</span>
              <button class="btn btn-primary" onclick="navigate('/dashboard')">
                Go to Dashboard ${icon('arrowRight', { size: 14 })}
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>`;

  mountSidebarToggle();
  mountLogout(ctx);
}
