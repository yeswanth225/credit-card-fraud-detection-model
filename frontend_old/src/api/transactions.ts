/**
 * Mock Phase1 API data for fraud detection dashboard
 * Fetches live data from the Phase1 classical model backend
 */
export const transactions = [
  {
    id: 'tx-001',
    amount: 450.00,
    timestamp: '2024-01-15T10:30:00Z',
    fraudScore: 0.89,
    status: 'fraud',
    merchant: 'Online Retailer',
    location: 'New York, NY',
    description: 'Online purchase - electronics',
  },
  {
    id: 'tx-002',
    amount: 1200.50,
    timestamp: '2024-01-15T09:15:00Z',
    fraudScore: 0.12,
    status: 'clear',
    merchant: 'Coffee Shop',
    location: 'Boston, MA',
    description: 'Morning coffee',
  },
  {
    id: 'tx-003',
    amount: 3250.00,
    timestamp: '2024-01-14T14:45:00Z',
    fraudScore: 0.67,
    status: 'pending',
    merchant: 'Travel Agency',
    location: 'Miami, FL',
    description: 'Flight booking',
  },
  {
    id: 'tx-004',
    amount: 89.99,
    timestamp: '2024-01-14T16:20:00Z',
    fraudScore: 0.04,
    status: 'clear',
    merchant: 'Groceries',
    location: 'Chicago, IL',
    description: 'Weekly shopping',
  },
  {
    id: 'tx-005',
    amount: 2100.00,
    timestamp: '2024-01-14T08:10:00Z',
    fraudScore: 0.93,
    status: 'fraud',
    merchant: 'Jewelry Store',
    location: 'Los Angeles, CA',
    description: 'Diamond ring purchase',
  },
];

export const fetchTransactions = async () => {
  // Mock API call - replace with real endpoint
  await new Promise((resolve) => setTimeout(resolve, 500));
  return transactions;
};