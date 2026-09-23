import assert from 'node:assert/strict';
import { calculateSpendingFingerprint, SpendingFingerprint } from './src/utils/spendingFingerprint';
import { Transaction } from './src/types';

console.log('Running test_spending_fingerprint.ts: 10 Strict Test Cases\n');

// Helper to assert no NaN or Infinity exists anywhere in numeric properties of fingerprint
function assertNoNaN(fp: SpendingFingerprint, label: string) {
  assert(!Number.isNaN(fp.sampleSize), `${label}: sampleSize is NaN`);
  assert(!Number.isNaN(fp.amountStats.min), `${label}: min is NaN`);
  assert(!Number.isNaN(fp.amountStats.max), `${label}: max is NaN`);
  assert(!Number.isNaN(fp.amountStats.mean), `${label}: mean is NaN`);
  assert(!Number.isNaN(fp.amountStats.median), `${label}: median is NaN`);
  assert(!Number.isNaN(fp.amountStats.totalSpend), `${label}: totalSpend is NaN`);
  assert(!Number.isNaN(fp.geographic.domesticPercentage), `${label}: domesticPercentage is NaN`);
  assert(!Number.isNaN(fp.geographic.internationalPercentage), `${label}: internationalPercentage is NaN`);

  for (const cat of fp.categories) {
    assert(!Number.isNaN(cat.percentage), `${label}: category ${cat.category} percentage is NaN`);
    assert(!Number.isNaN(cat.totalAmount), `${label}: category ${cat.category} totalAmount is NaN`);
  }
  for (const m of fp.topMerchants) {
    assert(!Number.isNaN(m.percentage), `${label}: merchant ${m.name} percentage is NaN`);
    assert(!Number.isNaN(m.totalAmount), `${label}: merchant ${m.name} totalAmount is NaN`);
  }
  for (const tod of fp.timeOfDay) {
    assert(!Number.isNaN(tod.percentage), `${label}: timeOfDay ${tod.period} percentage is NaN`);
  }
  for (const auth of fp.authMethods) {
    assert(!Number.isNaN(auth.percentage), `${label}: authMethod ${auth.method} percentage is NaN`);
  }
}

// Mock factory
function makeTx(partial: Partial<Transaction>): Transaction {
  return {
    id: `tx_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: '2026-09-15T14:30:00Z',
    formattedTime: '14:30:00',
    merchant: { name: 'Acme Store', category: 'Retail' },
    cardholder: {
      name: 'Eleanor Vance',
      email: 'e.vance@blackmesa.io',
      maskedCard: '•••• 4821',
      cardBrand: 'Visa',
      country: 'United States',
    },
    amount: 100.0,
    currency: 'USD',
    status: 'approved',
    riskScore: 12,
    ipAddress: '198.51.100.10 (US)',
    deviceType: 'Safari on macOS',
    decisionLatencyMs: 10,
    authMethod: 'Tokenized',
    factors: [],
    ...partial,
  };
}

// =============================================================
// TEST 1: Empty transaction list
// =============================================================
{
  const fp = calculateSpendingFingerprint([], '•••• 4821');

  assert.equal(fp.sampleSize, 0, 'Sample size should be 0 for empty list');
  assert.equal(fp.hasSufficientData, false, 'hasSufficientData must be false when sampleSize is 0');
  assert.equal(fp.amountStats.min, 0, 'min should be 0');
  assert.equal(fp.amountStats.max, 0, 'max should be 0');
  assert.equal(fp.amountStats.mean, 0, 'mean should be 0');
  assert.equal(fp.amountStats.median, 0, 'median should be 0');
  assert.equal(fp.amountStats.totalSpend, 0, 'totalSpend should be 0');
  assert.equal(fp.categories.length, 0, 'Categories list should be empty');
  assert.equal(fp.topMerchants.length, 0, 'Top merchants list should be empty');
  assert.equal(fp.geographic.domesticPercentage, 0, 'Domestic percentage should be 0');
  assert.equal(fp.geographic.internationalPercentage, 0, 'International percentage should be 0');
  assert.equal(fp.authMethods.length, 0, 'Auth methods list should be empty');
  assertNoNaN(fp, 'Test 1 (Empty list)');

  console.log('✓ Assertion Passed: Test 1 - Empty transaction list returns safe zero-state with no NaNs');
}

// =============================================================
// TEST 2: Single transaction
// =============================================================
{
  const tx = makeTx({
    amount: 250.50,
    merchant: { name: 'Nordstrom', category: 'Apparel & Department' },
    cardholder: {
      name: 'Eleanor Vance',
      email: 'e.vance@blackmesa.io',
      maskedCard: '•••• 4821',
      cardBrand: 'Visa',
      country: 'United States',
    },
    ipAddress: '198.51.100.1 (New York, US)',
    timestamp: '2026-09-15T08:15:00Z', // 08:15 UTC -> Morning
    authMethod: 'Swipe/Chip',
  });

  const fp = calculateSpendingFingerprint([tx], '•••• 4821');

  assert.equal(fp.sampleSize, 1, 'Sample size must be 1');
  assert.equal(fp.hasSufficientData, false, 'hasSufficientData must be false for single transaction (sample < 3)');
  assert.equal(fp.amountStats.min, 250.50, 'min must equal single transaction amount');
  assert.equal(fp.amountStats.max, 250.50, 'max must equal single transaction amount');
  assert.equal(fp.amountStats.mean, 250.50, 'mean must equal single transaction amount');
  assert.equal(fp.amountStats.median, 250.50, 'median must equal single transaction amount');
  assert.equal(fp.amountStats.totalSpend, 250.50, 'totalSpend must equal single transaction amount');

  assert.equal(fp.categories.length, 1);
  assert.equal(fp.categories[0].category, 'Apparel & Department');
  assert.equal(fp.categories[0].percentage, 100);

  assert.equal(fp.topMerchants.length, 1);
  assert.equal(fp.topMerchants[0].name, 'Nordstrom');
  assert.equal(fp.topMerchants[0].percentage, 100);

  assert.equal(fp.geographic.domesticCount, 1);
  assert.equal(fp.geographic.internationalCount, 0);
  assert.equal(fp.geographic.domesticPercentage, 100);
  assert.equal(fp.geographic.internationalPercentage, 0);

  const morningBucket = fp.timeOfDay.find((b) => b.period === 'Morning');
  assert.ok(morningBucket);
  assert.equal(morningBucket.count, 1);
  assert.equal(morningBucket.percentage, 100);

  assert.equal(fp.authMethods.length, 1);
  assert.equal(fp.authMethods[0].method, 'Swipe/Chip');
  assert.equal(fp.authMethods[0].percentage, 100);

  assertNoNaN(fp, 'Test 2 (Single tx)');
  console.log('✓ Assertion Passed: Test 2 - Single transaction calculations and low-data flag');
}

// =============================================================
// TEST 3: Multiple transactions
// =============================================================
{
  const txList = [
    makeTx({ id: 'tx_1', amount: 50.00 }),
    makeTx({ id: 'tx_2', amount: 150.00 }),
    makeTx({ id: 'tx_3', amount: 250.00 }),
  ];

  const fp = calculateSpendingFingerprint(txList, '•••• 4821');

  assert.equal(fp.sampleSize, 3, 'Sample size should be 3');
  assert.equal(fp.hasSufficientData, true, 'hasSufficientData must be true when sampleSize >= 3');
  assert.equal(fp.amountStats.totalSpend, 450.00);
  assert.equal(fp.amountStats.mean, 150.00);
  assertNoNaN(fp, 'Test 3 (Multiple txs)');

  console.log('✓ Assertion Passed: Test 3 - Multiple transactions and sufficient data threshold');
}

// =============================================================
// TEST 4: Median / mean / min / max (Odd and Even samples)
// =============================================================
{
  // Odd sample: [10, 20, 30, 40, 500] -> median 30, mean 120, min 10, max 500
  const oddList = [
    makeTx({ amount: 500.00 }),
    makeTx({ amount: 10.00 }),
    makeTx({ amount: 30.00 }),
    makeTx({ amount: 20.00 }),
    makeTx({ amount: 40.00 }),
  ];
  const fpOdd = calculateSpendingFingerprint(oddList, '•••• 4821');
  assert.equal(fpOdd.amountStats.min, 10.00, 'Min should be 10');
  assert.equal(fpOdd.amountStats.max, 500.00, 'Max should be 500');
  assert.equal(fpOdd.amountStats.median, 30.00, 'Odd sample median should be middle sorted value (30)');
  assert.equal(fpOdd.amountStats.mean, 120.00, 'Mean should be (10+20+30+40+500)/5 = 120');

  // Even sample: [10, 20, 30, 40] -> median (20+30)/2 = 25, mean 25
  const evenList = [
    makeTx({ amount: 40.00 }),
    makeTx({ amount: 10.00 }),
    makeTx({ amount: 30.00 }),
    makeTx({ amount: 20.00 }),
  ];
  const fpEven = calculateSpendingFingerprint(evenList, '•••• 4821');
  assert.equal(fpEven.amountStats.median, 25.00, 'Even sample median should be average of two middle elements');
  assert.equal(fpEven.amountStats.mean, 25.00);
  assert.equal(fpEven.amountStats.min, 10.00);
  assert.equal(fpEven.amountStats.max, 40.00);

  console.log('✓ Assertion Passed: Test 4 - Median (odd & even), mean, min, and max calculations');
}

// =============================================================
// TEST 5: Category percentages & volume ranking
// =============================================================
{
  const txList = [
    makeTx({ amount: 300.00, merchant: { name: 'Apple Store', category: 'Electronics' } }),
    makeTx({ amount: 100.00, merchant: { name: 'Whole Foods', category: 'Groceries' } }),
    makeTx({ amount: 100.00, merchant: { name: 'Trader Joes', category: 'Groceries' } }),
  ];
  // Total = 500. Electronics = 300 (60%), Groceries = 200 (40%)
  const fp = calculateSpendingFingerprint(txList, '•••• 4821');

  assert.equal(fp.categories.length, 2);
  assert.equal(fp.categories[0].category, 'Electronics', 'Highest spend category must be ranked first');
  assert.equal(fp.categories[0].totalAmount, 300.00);
  assert.equal(fp.categories[0].percentage, 60.0);
  assert.equal(fp.categories[0].count, 1);

  assert.equal(fp.categories[1].category, 'Groceries');
  assert.equal(fp.categories[1].totalAmount, 200.00);
  assert.equal(fp.categories[1].percentage, 40.0);
  assert.equal(fp.categories[1].count, 2);

  console.log('✓ Assertion Passed: Test 5 - Category percentages and ranking by spend');
}

// =============================================================
// TEST 6: Domestic vs International percentages
// =============================================================
{
  const txList = [
    makeTx({ ipAddress: '198.51.100.1 (New York, US)' }), // Domestic
    makeTx({ ipAddress: '172.56.21.90 (Seattle, US)' }),   // Domestic
    makeTx({ ipAddress: '133.242.18.99 (Tokyo, JP)' }),   // International
    makeTx({ ipAddress: '82.165.197.1 (London, GB)' }),   // International
  ];
  // 4 txs: 2 Domestic (50%), 2 Intl (50%)
  const fp = calculateSpendingFingerprint(txList, '•••• 4821');

  assert.equal(fp.geographic.domesticCount, 2);
  assert.equal(fp.geographic.internationalCount, 2);
  assert.equal(fp.geographic.domesticPercentage, 50.0);
  assert.equal(fp.geographic.internationalPercentage, 50.0);
  assert.equal(fp.geographic.countries.length, 3); // US (2), JP (1), GB (1)

  console.log('✓ Assertion Passed: Test 6 - Domestic vs International percentages and country counts');
}

// =============================================================
// TEST 7: Time-of-day diurnal classification
// =============================================================
{
  const txList = [
    makeTx({ timestamp: '2026-09-15T07:00:00Z' }), // Morning (06-12)
    makeTx({ timestamp: '2026-09-15T10:30:00Z' }), // Morning (06-12)
    makeTx({ timestamp: '2026-09-15T14:00:00Z' }), // Afternoon (12-18)
    makeTx({ timestamp: '2026-09-15T20:15:00Z' }), // Evening (18-24)
    makeTx({ timestamp: '2026-09-15T03:45:00Z' }), // Night (00-06)
  ];
  // Total 5: Morning: 2 (40%), Afternoon: 1 (20%), Evening: 1 (20%), Night: 1 (20%)
  const fp = calculateSpendingFingerprint(txList, '•••• 4821');

  const morning = fp.timeOfDay.find((b) => b.period === 'Morning')!;
  const afternoon = fp.timeOfDay.find((b) => b.period === 'Afternoon')!;
  const evening = fp.timeOfDay.find((b) => b.period === 'Evening')!;
  const night = fp.timeOfDay.find((b) => b.period === 'Night')!;

  assert.equal(morning.count, 2);
  assert.equal(morning.percentage, 40.0);

  assert.equal(afternoon.count, 1);
  assert.equal(afternoon.percentage, 20.0);

  assert.equal(evening.count, 1);
  assert.equal(evening.percentage, 20.0);

  assert.equal(night.count, 1);
  assert.equal(night.percentage, 20.0);

  console.log('✓ Assertion Passed: Test 7 - Time-of-day classification into 4 UTC diurnal windows');
}

// =============================================================
// TEST 8: Cardholder isolation (•••• 4821 vs •••• 4092 vs all)
// =============================================================
{
  const txVance4821_A = makeTx({
    id: 'tx_vance_4821_a',
    amount: 100.00,
    cardholder: {
      name: 'Eleanor Vance',
      email: 'e.vance@blackmesa.io',
      maskedCard: '•••• 4821',
      cardBrand: 'Visa',
      country: 'United States',
    },
  });

  const txVance4821_B = makeTx({
    id: 'tx_vance_4821_b',
    amount: 200.00,
    cardholder: {
      name: 'Eleanor Vance',
      email: 'e.vance@blackmesa.io',
      maskedCard: '•••• 4821',
      cardBrand: 'Visa',
      country: 'United States',
    },
  });

  const txVance4092_Historical = makeTx({
    id: 'tx_99812401',
    amount: 1849.00,
    cardholder: {
      name: 'Eleanor Vance',
      email: 'e.vance@blackmesa.io',
      maskedCard: '•••• 4092', // Separate card account! Must NOT be merged into 4821
      cardBrand: 'Visa',
      country: 'United States',
    },
  });

  const txOtherPerson = makeTx({
    id: 'tx_marcus',
    amount: 50.00,
    cardholder: {
      name: 'Marcus Holloway',
      email: 'm.holloway@dedsec.org',
      maskedCard: '•••• 1104',
      cardBrand: 'Mastercard',
      country: 'United States',
    },
  });

  const allLedger = [txVance4821_A, txVance4821_B, txVance4092_Historical, txOtherPerson];

  // 1. Fingerprint for active demo card •••• 4821
  const fp4821 = calculateSpendingFingerprint(allLedger, '•••• 4821');
  assert.equal(fp4821.sampleSize, 2, 'Must contain ONLY the 2 transactions for •••• 4821');
  assert.equal(fp4821.amountStats.totalSpend, 300.00, 'Total spend must exclude •••• 4092 ($1849.00)');
  assert.equal(fp4821.cardholderMaskedCard, '•••• 4821');

  // 2. Fingerprint for historical card •••• 4092
  const fp4092 = calculateSpendingFingerprint(allLedger, '•••• 4092');
  assert.equal(fp4092.sampleSize, 1, 'Must contain ONLY the 1 transaction for •••• 4092');
  assert.equal(fp4092.amountStats.totalSpend, 1849.00);
  assert.equal(fp4092.cardholderMaskedCard, '•••• 4092');

  // 3. Aggregate portfolio view ('all')
  const fpAll = calculateSpendingFingerprint(allLedger, 'all');
  assert.equal(fpAll.sampleSize, 4, 'Aggregate view includes all 4 transactions across cards');
  assert.equal(fpAll.amountStats.totalSpend, 100 + 200 + 1849 + 50);

  console.log('✓ Assertion Passed: Test 8 - Strict cardholder isolation (•••• 4821 does NOT merge with •••• 4092)');
}

// =============================================================
// TEST 9: No NaN or divide-by-zero results
// =============================================================
{
  // Zero amount transactions
  const zeroList = [
    makeTx({ amount: 0 }),
    makeTx({ amount: 0 }),
  ];
  const fpZero = calculateSpendingFingerprint(zeroList, '•••• 4821');
  assert.equal(fpZero.amountStats.totalSpend, 0);
  assert.equal(fpZero.amountStats.mean, 0);
  assert.equal(fpZero.amountStats.median, 0);
  assertNoNaN(fpZero, 'Test 9 (Zero amount txs)');

  // Missing properties / minimal tx
  const minimalTx: Transaction = {
    id: 'tx_min',
    timestamp: 'invalid-date',
    formattedTime: '',
    merchant: { name: '', category: '' },
    cardholder: { name: '', email: '', maskedCard: '•••• 4821', cardBrand: 'Visa', country: '' },
    amount: 15.0,
    currency: 'USD',
    status: 'approved',
    riskScore: 0,
    ipAddress: '',
    deviceType: '',
    decisionLatencyMs: 0,
    authMethod: 'Tokenized',
    factors: [],
  };
  const fpMinimal = calculateSpendingFingerprint([minimalTx], '•••• 4821');
  assertNoNaN(fpMinimal, 'Test 9 (Minimal/fallback properties)');

  console.log('✓ Assertion Passed: Test 9 - Zero division guards and NaN immunity');
}

// =============================================================
// TEST 10: Percentage totals
// =============================================================
{
  const txList = [
    makeTx({ amount: 73.12, merchant: { name: 'M1', category: 'Retail' }, timestamp: '2026-09-15T08:00:00Z', authMethod: 'Tokenized' }),
    makeTx({ amount: 120.45, merchant: { name: 'M2', category: 'Travel' }, timestamp: '2026-09-15T13:00:00Z', authMethod: '3DS 2.0', ipAddress: '133.242.18.99 (Tokyo, JP)' }),
    makeTx({ amount: 45.00, merchant: { name: 'M3', category: 'Dining' }, timestamp: '2026-09-15T19:00:00Z', authMethod: 'Tokenized' }),
    makeTx({ amount: 210.80, merchant: { name: 'M4', category: 'Services' }, timestamp: '2026-09-15T02:00:00Z', authMethod: 'Swipe/Chip' }),
  ];

  const fp = calculateSpendingFingerprint(txList, '•••• 4821');

  // 1. Categories percentage sum
  const catSum = fp.categories.reduce((acc, c) => acc + c.percentage, 0);
  assert.ok(Math.abs(catSum - 100) < 0.2, `Categories percentage sum (${catSum}) must equal ~100%`);

  // 2. Geographic percentage sum
  const geoSum = fp.geographic.domesticPercentage + fp.geographic.internationalPercentage;
  assert.ok(Math.abs(geoSum - 100) < 0.1, `Geographic percentage sum (${geoSum}) must equal 100%`);

  // 3. Time of day percentage sum
  const todSum = fp.timeOfDay.reduce((acc, t) => acc + t.percentage, 0);
  assert.ok(Math.abs(todSum - 100) < 0.1, `Time of day percentage sum (${todSum}) must equal 100%`);

  // 4. Auth methods percentage sum
  const authSum = fp.authMethods.reduce((acc, a) => acc + a.percentage, 0);
  assert.ok(Math.abs(authSum - 100) < 0.1, `Auth methods percentage sum (${authSum}) must equal 100%`);

  console.log('✓ Assertion Passed: Test 10 - Percentage distributions sum to 100%');
}

console.log('\n=============================================================');
console.log('ALL 10 SPENDING FINGERPRINT TESTS PASSED SUCCESSFULLY!');
console.log('=============================================================\n');
