/**
 * export.js — CSV and PDF export for [cred]
 * Formats currency as INR (₹) and uses jsPDF for PDF generation.
 */

function fmt(val) { return val === undefined || val === null ? '' : String(val); }
function fmtAmt(val) { return val !== undefined && val !== null ? `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''; }
function fmtPct(score) { return `${Math.round((score ?? 0) * 100)}%`; }
function fmtDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}
function fmtDateTime(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

/* ================================================================
   CSV Export
================================================================ */
export function exportToCSV(transactions, filename, modelType = 'classical') {
  if (!transactions?.length) throw new Error('No transactions to export.');

  const HEADERS = [
    'Transaction ID', 'Date', 'Merchant', 'Amount (INR)', 'MCC', 'Country',
    'Card Type', 'Hour', 'Distance (km)', 'Model', 'Fraud Score', 'Flag',
    'Risk Level', 'Top Risk Factor', 'Explanation',
  ];

  function row(tx) {
    const r = tx[modelType] || tx.classical;
    const topFeature = r?.features?.find(f => f.direction === 'up');
    const riskLevel = r ? (r.score >= 0.7 ? 'High' : r.score >= 0.4 ? 'Medium' : 'Low') : '';
    return [
      fmt(tx.id), fmt(tx.date), fmt(tx.merchant), fmtAmt(tx.amount),
      fmt(tx.mcc), fmt(tx.country), fmt(tx.card_type), fmt(tx.hour),
      fmt(tx.distance_from_home),
      modelType.charAt(0).toUpperCase() + modelType.slice(1),
      r ? fmtPct(r.score) : '', r ? (r.flag ? 'Fraud' : 'Legitimate') : '',
      riskLevel,
      topFeature ? topFeature.label : '',
      r ? (r.explanation || '') : '',
    ];
  }

  const lines = [HEADERS, ...transactions.map(row)]
    .map(cells => cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  download(new Blob(['\uFEFF' + lines], { type: 'text/csv;charset=utf-8;' }),
    filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/* ================================================================
   PDF Export
================================================================ */
export function exportToPDF(transactions, filename, { userName, batchName, modelType = 'classical', exportedAt } = {}) {
  if (!window.jspdf?.jsPDF)
    throw new Error('PDF library not loaded. Please check your internet connection and try again.');
  if (!transactions?.length)
    throw new Error('No transactions to export.');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();   // 297
  const H = doc.internal.pageSize.getHeight();  // 210
  const M = 14; // margin

  /* --- Header bar --- */
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, W, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('[cred]', M, 12);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text('Smart Fraud Detection System', M + 20, 12);
  doc.text(`Exported: ${fmtDateTime(exportedAt || new Date().toISOString())}`, W - M, 12, { align: 'right' });

  /* --- Report meta --- */
  doc.setTextColor(10, 10, 10);
  let y = 28;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text(batchName || 'Fraud Detection Report', M, y); y += 6;
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 107, 107);
  const flagged = transactions.filter(tx => (tx[modelType] || tx.classical)?.flag).length;
  const metaLine = [
    userName && `Account: ${userName}`,
    `Model: ${modelType.charAt(0).toUpperCase() + modelType.slice(1)}`,
    `Total: ${transactions.length}`,
    `Flagged: ${flagged}`,
    `Fraud rate: ${transactions.length ? Math.round(flagged / transactions.length * 100) : 0}%`,
  ].filter(Boolean).join('   ');
  doc.text(metaLine, M, y); y += 10;

  /* --- Divider --- */
  doc.setDrawColor(228, 228, 228); doc.line(M, y, W - M, y); y += 6;

  /* --- Table columns --- */
  const COLS = [
    { h: 'Date',        w: 24 }, { h: 'Merchant',    w: 50 },
    { h: 'Amount (INR)',w: 24 }, { h: 'Country',     w: 18 },
    { h: 'Card Type',   w: 22 }, { h: 'Hour',        w: 12 },
    { h: 'Score',       w: 16 }, { h: 'Flag',        w: 20 },
    { h: 'Top Factor',  w: 58 },
  ];
  const totalW = COLS.reduce((s, c) => s + c.w, 0);

  /* Header row */
  doc.setFillColor(240, 240, 240);
  doc.rect(M, y - 4, totalW, 8, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(74, 74, 74);
  let x = M;
  for (const col of COLS) { doc.text(col.h, x + 2, y); x += col.w; }
  y += 6;

  /* Data rows */
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  const ROW_H = 6;

  for (let i = 0; i < transactions.length; i++) {
    if (y + ROW_H > H - 14) {
      doc.addPage();
      y = 20;
      doc.setFillColor(240, 240, 240);
      doc.rect(M, y - 4, totalW, 8, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(74, 74, 74);
      let xh = M;
      for (const col of COLS) { doc.text(col.h, xh + 2, y); xh += col.w; }
      y += 6;
      doc.setFont('helvetica', 'normal');
    }

    const tx = transactions[i];
    const r = tx[modelType] || tx.classical;
    const isFlag = r?.flag;
    const topFeat = r?.features?.find(f => f.direction === 'up');

    if (i % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(M, y - 4, totalW, ROW_H, 'F'); }
    doc.setTextColor(isFlag ? 185 : 10, isFlag ? 28 : 10, isFlag ? 28 : 10);

    function clip(str, col) {
      const maxChars = Math.floor(col.w / 1.85);
      return String(str ?? '').length > maxChars ? String(str).slice(0, maxChars - 1) + '…' : String(str ?? '');
    }

    // In jsPDF standard font, use Rs. or INR prefix to avoid character substitution issues
    const formattedAmount = `Rs. ${Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const rowData = [
      fmtDate(tx.date), tx.merchant, formattedAmount, tx.country,
      tx.card_type, tx.hour, r ? fmtPct(r.score) : '',
      r ? (r.flag ? 'Fraud' : 'OK') : '',
      topFeat ? topFeat.label : '—',
    ];

    x = M;
    for (let j = 0; j < COLS.length; j++) {
      const col = COLS[j];
      const val = clip(rowData[j], col);
      const isNumCol = col.h.includes('Amount') || col.h === 'Score';
      if (isNumCol) {
        doc.text(val, x + col.w - 2, y, { align: 'right' });
      } else {
        doc.text(val, x + 2, y);
      }
      x += col.w;
    }
    y += ROW_H;
  }

  /* --- Footer --- */
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(6); doc.setTextColor(160, 160, 160);
    doc.text('[cred] — Confidential financial fraud report.', M, H - 6);
    doc.text(`Page ${p} of ${pages}`, W - M, H - 6, { align: 'right' });
  }

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
