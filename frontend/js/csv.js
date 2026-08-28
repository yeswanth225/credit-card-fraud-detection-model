/**
 * csv.js — CSV parser and schema validator for [cred]
 */

export const REQUIRED_COLUMNS = ['amount', 'merchant', 'mcc', 'country', 'card_type', 'hour', 'distance_from_home'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_ROWS = 10_000;

/** Parse raw CSV text -> { headers, rows } */
export function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 1) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim().replace(/[\s-]+/g, '_'));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = parseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => { row[h] = (vals[idx] ?? '').trim(); });
    rows.push(row);
  }
  return { headers, rows };
}

function parseCSVLine(line) {
  const vals = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      vals.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  vals.push(cur);
  return vals.map(v => v.trim());
}

/** File-level validation (before reading) */
export function validateCSVFile(file) {
  if (!file) return { valid: false, error: 'No file selected.' };
  if (!file.name.toLowerCase().endsWith('.csv'))
    return { valid: false, error: 'Please upload a .csv file.' };
  if (file.size === 0)
    return { valid: false, error: 'The selected file is empty.' };
  if (file.size > MAX_FILE_SIZE_BYTES)
    return { valid: false, error: `File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the 5 MB limit. Please split your data and upload in smaller batches.` };
  return { valid: true };
}

/** Schema + data validation -> { valid, errors, warnings, transactions, totalRows, validRows } */
export function validateAndTransform(parsed) {
  const { headers, rows } = parsed;

  if (!headers.length)
    return { valid: false, errors: ['The file appears to be empty or has no header row.'] };

  const missing = REQUIRED_COLUMNS.filter(c => !headers.includes(c));
  if (missing.length)
    return { valid: false, errors: [`Missing required columns: ${missing.map(c => `"${c}"`).join(', ')}. Expected: ${REQUIRED_COLUMNS.join(', ')}.`] };

  if (!rows.length)
    return { valid: false, errors: ['The file contains no data rows (only a header was found).'] };

  if (rows.length > MAX_ROWS)
    return { valid: false, errors: [`The file contains ${rows.length.toLocaleString()} rows, exceeding the ${MAX_ROWS.toLocaleString()}-row limit. Please split your data and upload in batches.`] };

  const transactions = [];
  const rowErrors = [];
  const MAX_SHOW_ERRORS = 5;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rn = i + 2; // 1-indexed row number including header

    const amount = parseFloat(row.amount);
    const mcc    = parseInt(row.mcc, 10);
    const hour   = parseInt(row.hour, 10);
    const dist   = parseFloat(row.distance_from_home);

    const errs = [];
    if (isNaN(amount) || amount <= 0 || amount > 10_000_000)
      errs.push(`"amount" must be a positive number ≤ 10,000,000 (got "${row.amount}")`);
    if (!row.merchant?.trim())
      errs.push('"merchant" is required');
    if (isNaN(mcc) || mcc < 1000 || mcc > 9999)
      errs.push(`"mcc" must be a 4-digit integer (got "${row.mcc}")`);
    if (!row.country || row.country.trim().length < 2)
      errs.push(`"country" must be at least 2 characters (got "${row.country}")`);
    if (!row.card_type?.trim())
      errs.push('"card_type" is required');
    if (isNaN(hour) || hour < 0 || hour > 23)
      errs.push(`"hour" must be 0–23 (got "${row.hour}")`);
    if (!isNaN(dist) && dist < 0)
      errs.push(`"distance_from_home" cannot be negative (got "${row.distance_from_home}")`);

    if (errs.length) {
      if (rowErrors.length < MAX_SHOW_ERRORS)
        rowErrors.push(`Row ${rn}: ${errs.join('; ')}.`);
      continue;
    }

    transactions.push({
      id: row.transaction_id || row.id || null,
      date: row.date || new Date().toISOString().split('T')[0],
      amount,
      merchant: row.merchant.trim(),
      mcc,
      country: row.country.toUpperCase().trim(),
      card_type: row.card_type.trim(),
      hour,
      distance_from_home: isNaN(dist) ? 0 : Math.max(0, dist),
      distance_from_last_tx: parseFloat(row.distance_from_last_tx) || 0,
      ratio_to_median: parseFloat(row.ratio_to_median) || 1.0,
      retry_attempts: parseInt(row.retry_attempts, 10) || 0,
      is_international: row.is_international === 'true' || row.is_international === '1',
      chip_authenticated: row.chip_authenticated !== 'false' && row.chip_authenticated !== '0',
    });
  }

  if (!transactions.length)
    return { valid: false, errors: ['No valid rows could be parsed.', ...rowErrors] };

  return {
    valid: true,
    transactions,
    warnings: rowErrors,
    totalRows: rows.length,
    validRows: transactions.length,
  };
}
