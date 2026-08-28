/**
 * store.js — localStorage data layer for [cred]
 * All data access must go through this module.
 * Ownership checks are enforced here, never in UI code.
 */

import { DATASET_BATCH_1_RAW, DATASET_BATCH_2_RAW } from './seed-data.js';
import { scoreTransaction } from './ml.js';

const K = {
  USERS:  'cred_users',
  SESS:   'cred_sessions',
  BATCHES:'cred_batches',
  NOTIFS: 'cred_notifications',
  TOKENS: 'cred_reset_tokens',
  META:   'cred_meta',
};

/* ---- Storage helpers ---- */
function read(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function readObj(key) { return read(key, {}); }
function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

/* ---- ID / hash utilities ---- */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function hashPass(pwd) {
  // Simple deterministic hash — NOT for production.
  let h = 5381;
  for (let i = 0; i < pwd.length; i++) h = ((h << 5) + h) ^ pwd.charCodeAt(i);
  return (h >>> 0).toString(16);
}

/* ==================================================================
   Auth
================================================================== */
export const Auth = {
  register(name, email, password) {
    if (!name?.trim()) throw new Error('Name is required.');
    if (!email?.trim()) throw new Error('Email is required.');
    if (!password || password.length < 8) throw new Error('Password must be at least 8 characters.');
    const emailNorm = email.toLowerCase().trim();
    const users = read(K.USERS);
    if (users.find(u => u.email === emailNorm)) throw new Error('An account with this email already exists.');
    const user = {
      id: generateId(),
      name: name.trim(),
      email: emailNorm,
      passwordHash: hashPass(password),
      createdAt: new Date().toISOString(),
      notificationPrefs: { highRisk: true, mediumRisk: false, emailEnabled: false },
    };
    users.push(user);
    write(K.USERS, users);
    return this._createSession(user);
  },

  login(email, password) {
    if (!email?.trim()) throw new Error('Email is required.');
    if (!password || password.length < 8) throw new Error('Password must be at least 8 characters.');
    const emailNorm = email.toLowerCase().trim();
    const users = read(K.USERS);
    const user = users.find(u => u.email === emailNorm);
    if (!user) {
      const name = emailNorm.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Fraud Analyst';
      return this.register(name, emailNorm, password);
    }
    if (user.passwordHash !== hashPass(password))
      throw new Error('Incorrect password.');
    return this._createSession(user);
  },

  _createSession(user) {
    const sessions = readObj(K.SESS);
    const token = generateId() + generateId();
    sessions[token] = {
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
    };
    write(K.SESS, sessions);
    localStorage.setItem('cred_token', token);
    Batches.seedDataset(user.id);
    return { user, token };
  },

  logout() {
    const token = localStorage.getItem('cred_token');
    if (token) {
      const sessions = readObj(K.SESS);
      delete sessions[token];
      write(K.SESS, sessions);
    }
    localStorage.removeItem('cred_token');
  },

  currentUser() {
    const token = localStorage.getItem('cred_token');
    if (!token) return null;
    const sessions = readObj(K.SESS);
    const sess = sessions[token];
    if (!sess || new Date(sess.expiresAt) < new Date()) { this.logout(); return null; }
    const users = read(K.USERS);
    const user = users.find(u => u.id === sess.userId) ?? null;
    if (user) {
      Batches.seedDataset(user.id);
    }
    return user;
  },

  /** Update name/email — requires current password. */
  updateProfile(userId, { name, email, currentPassword }) {
    if (!currentPassword) throw new Error('Please enter your current password to save changes.');
    const users = read(K.USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found.');
    const user = users[idx];
    if (user.passwordHash !== hashPass(currentPassword)) throw new Error('Current password is incorrect.');
    if (email) {
      const emailNorm = email.toLowerCase().trim();
      if (emailNorm !== user.email) {
        if (users.find(u => u.email === emailNorm && u.id !== userId))
          throw new Error('That email address is already in use.');
        user.email = emailNorm;
      }
    }
    if (name) user.name = name.trim();
    write(K.USERS, users);
    return users[idx];
  },

  changePassword(userId, currentPassword, newPassword) {
    if (!newPassword || newPassword.length < 8)
      throw new Error('New password must be at least 8 characters.');
    const users = read(K.USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found.');
    if (users[idx].passwordHash !== hashPass(currentPassword))
      throw new Error('Current password is incorrect.');
    users[idx].passwordHash = hashPass(newPassword);
    write(K.USERS, users);
    // Invalidate all other sessions
    const sessions = readObj(K.SESS);
    const curToken = localStorage.getItem('cred_token');
    for (const t of Object.keys(sessions)) {
      if (sessions[t].userId === userId && t !== curToken) delete sessions[t];
    }
    write(K.SESS, sessions);
  },

  updateNotificationPrefs(userId, prefs) {
    const users = read(K.USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found.');
    users[idx].notificationPrefs = { ...users[idx].notificationPrefs, ...prefs };
    write(K.USERS, users);
    return users[idx];
  },

  /** Request password reset. Always returns generic result to prevent enumeration. */
  requestPasswordReset(email) {
    const emailNorm = email.toLowerCase().trim();
    const users = read(K.USERS);
    const user = users.find(u => u.email === emailNorm);
    if (!user) return null; // Silent — never reveal whether email exists
    const tokens = read(K.TOKENS);
    const token = generateId() + generateId();
    tokens.push({
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
      used: false,
    });
    write(K.TOKENS, tokens);
    return token; // In production: emailed as a link
  },

  validateResetToken(token) {
    const tokens = read(K.TOKENS);
    const entry = tokens.find(t => t.token === token);
    if (!entry) return { valid: false, reason: 'invalid' };
    if (entry.used) return { valid: false, reason: 'used' };
    if (new Date(entry.expiresAt) < new Date()) return { valid: false, reason: 'expired' };
    return { valid: true, userId: entry.userId };
  },

  resetPassword(token, newPassword) {
    const { valid, userId, reason } = this.validateResetToken(token);
    if (!valid) throw new Error(reason === 'expired'
      ? 'This reset link has expired. Please request a new one.'
      : 'This reset link is invalid or has already been used.');
    if (!newPassword || newPassword.length < 8)
      throw new Error('Password must be at least 8 characters.');
    const users = read(K.USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found.');
    users[idx].passwordHash = hashPass(newPassword);
    write(K.USERS, users);
    // Invalidate all sessions
    const sessions = readObj(K.SESS);
    for (const t of Object.keys(sessions)) {
      if (sessions[t].userId === userId) delete sessions[t];
    }
    write(K.SESS, sessions);
    localStorage.removeItem('cred_token');
    // Mark token used
    const tokens = read(K.TOKENS);
    const tIdx = tokens.findIndex(t => t.token === token);
    if (tIdx !== -1) { tokens[tIdx].used = true; write(K.TOKENS, tokens); }
  },
};

/* ==================================================================
   Batches (includes embedded transactions)
================================================================== */
export const Batches = {
  create(userId, { type, fileName, transactions, modelUsed }) {
    const batches = read(K.BATCHES);
    const batch = {
      id: generateId(),
      userId,
      type,           // 'csv' | 'single'
      fileName: fileName || null,
      uploadedAt: new Date().toISOString(),
      modelUsed,
      transactions,   // scored transaction objects embedded
      status: 'complete',
    };
    batches.push(batch);
    write(K.BATCHES, batches);
    return batch;
  },

  list(userId) {
    const allBatches = read(K.BATCHES);
    const userBatches = allBatches.filter(b => b.userId === userId);
    const seen = new Set();
    const unique = [];
    let hadDuplicates = false;

    // Sort newest first
    const sorted = [...userBatches].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    for (const b of sorted) {
      // Deduplicate by normalized fileName if present (prevents duplicate dataset sample loads), or by id
      const key = b.fileName ? `fn_${b.fileName.toLowerCase().trim()}` : `id_${b.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(b);
      } else {
        hadDuplicates = true;
      }
    }

    // Auto-heal localStorage if duplicates were accumulated in user's browser
    if (hadDuplicates) {
      const otherBatches = allBatches.filter(b => b.userId !== userId);
      write(K.BATCHES, [...otherBatches, ...unique]);
    }

    return unique;
  },

  /** Ownership-enforced read. Returns null if not owned by userId. */
  get(userId, batchId) {
    const batch = this.list(userId).find(b => b.id === batchId);
    if (!batch || batch.userId !== userId) return null;
    return batch;
  },

  delete(userId, batchId) {
    const batches = read(K.BATCHES);
    const idx = batches.findIndex(b => b.id === batchId && b.userId === userId);
    if (idx === -1) return false;
    batches.splice(idx, 1);
    write(K.BATCHES, batches);
    // Cascade delete notifications
    const notifs = read(K.NOTIFS).filter(n => !(n.batchId === batchId && n.userId === userId));
    write(K.NOTIFS, notifs);
    return true;
  },

  /** Find a single transaction across all of a user's batches. */
  getTransaction(userId, transactionId) {
    for (const batch of this.list(userId)) {
      const tx = batch.transactions?.find(t => t.id === transactionId);
      if (tx) return { transaction: tx, batch };
    }
    return null;
  },

  /** Recent N batches for dashboard strip. */
  recent(userId, n = 5) {
    return this.list(userId).slice(0, n);
  },

  /** Populate authentic credit card dataset batches for a user */
  seedDataset(userId, force = false) {
    const existing = this.list(userId);
    if (!force && existing.length > 0) return existing;

    const allBatches = read(K.BATCHES);
    const otherBatches = allBatches.filter(b => b.userId !== userId);

    // Deep clone and score Batch 1 (35 transactions)
    const scored1 = DATASET_BATCH_1_RAW.map((tx, idx) => scoreTransaction({
      ...tx,
      id: `tx_ds_prod_${idx + 1}`
    }));
    const batch1 = {
      id: `batch_ds_prod_${(userId || 'u').slice(0, 5)}`,
      userId,
      type: 'csv',
      fileName: 'creditcard_production_sample_01.csv',
      uploadedAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      modelUsed: 'hybrid',
      transactions: scored1,
      status: 'complete',
    };

    // Deep clone and score Batch 2 (20 transactions)
    const scored2 = DATASET_BATCH_2_RAW.map((tx, idx) => scoreTransaction({
      ...tx,
      id: `tx_ds_audit_${idx + 1}`
    }));
    const batch2 = {
      id: `batch_ds_audit_${(userId || 'u').slice(0, 5)}`,
      userId,
      type: 'csv',
      fileName: 'flagged_audit_ledger_02.csv',
      uploadedAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
      modelUsed: 'hybrid',
      transactions: scored2,
      status: 'complete',
    };

    write(K.BATCHES, [...otherBatches, batch1, batch2]);

    // Clean up and recreate deterministic alerts for high risk transactions (exactly 12 alerts)
    let otherNotifs = read(K.NOTIFS).filter(n => n.userId !== userId);
    let newNotifs = [];

    for (const tx of scored1) {
      if ((tx.classical?.score ?? 0) >= 0.70) {
        newNotifs.push({
          id: `notif_${tx.id}`,
          userId,
          transactionId: tx.id,
          batchId: batch1.id,
          riskLevel: 'high',
          message: `High Risk Alert: ${tx.merchant} (₹${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}) flagged at ${Math.round(tx.classical.score * 100)}% fraud probability.`,
          read: false,
          createdAt: new Date(Date.now() - 3600 * 1000 * 3 + (tx.hour || 0) * 60000).toISOString(),
        });
      }
    }

    for (const tx of scored2) {
      if ((tx.classical?.score ?? 0) >= 0.70) {
        newNotifs.push({
          id: `notif_${tx.id}`,
          userId,
          transactionId: tx.id,
          batchId: batch2.id,
          riskLevel: 'high',
          message: `High Risk Alert: ${tx.merchant} (₹${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}) flagged at ${Math.round(tx.classical.score * 100)}% fraud probability.`,
          read: false,
          createdAt: new Date(Date.now() - 3600 * 1000 * 26 + (tx.hour || 0) * 60000).toISOString(),
        });
      }
    }

    write(K.NOTIFS, [...otherNotifs, ...newNotifs]);
    return [batch1, batch2];
  },
};

/* ==================================================================
   Notifications
================================================================== */
export const Notifications = {
  create(userId, { transactionId, batchId, riskLevel, message }) {
    const notifs = read(K.NOTIFS);
    const notif = { id: generateId(), userId, transactionId, batchId, riskLevel, message, read: false, createdAt: new Date().toISOString() };
    notifs.push(notif);
    write(K.NOTIFS, notifs);
    return notif;
  },

  list(userId) {
    const raw = read(K.NOTIFS).filter(n => n.userId === userId);
    const seen = new Set();
    const unique = [];
    for (const n of raw) {
      const key = n.transactionId ? `${n.transactionId}_${n.riskLevel}` : n.id;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(n);
      }
    }
    return unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  unreadCount(userId) {
    return this.list(userId).filter(n => !n.read).length;
  },

  markRead(userId, notifId) {
    const notifs = read(K.NOTIFS);
    const n = notifs.find(n => n.id === notifId && n.userId === userId);
    if (n) { n.read = true; write(K.NOTIFS, notifs); }
  },

  markAllRead(userId) {
    const notifs = read(K.NOTIFS);
    let changed = false;
    for (const n of notifs) { if (n.userId === userId && !n.read) { n.read = true; changed = true; } }
    if (changed) write(K.NOTIFS, notifs);
  },
};

/* ==================================================================
   App Meta (adaptive learning indicator, etc.)
================================================================== */
export const AppMeta = {
  getModelLastUpdated() {
    return readObj(K.META).modelLastUpdated || '2026-08-15T12:00:00.000Z';
  },
  setModelLastUpdated() {
    const meta = readObj(K.META);
    meta.modelLastUpdated = new Date().toISOString();
    write(K.META, meta);
  },
};
