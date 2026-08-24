import React from 'react';
import { SortableTable } from '../components';
import { transactions } from '../api/transactions';

const TransactionList = () => {
  const [transactionsData, setTransactionsData] = useState([]);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const fetchTransactions = async () => {
    const res = await axios.get('/api/analyst/transactions');
    setTransactionsData(res.data);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedTransactions = transactionsData.sort((a, b) => {
    const valA = a[sortColumn] || '';
    const valB = b[sortColumn] || '';
    return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });

  return (
    <div className="flex flex-col overflow-y-scroll py-4">
      <SortableTable
        data={sortedTransactions}
        columns={[
          { header:"Amount", key:"amount" },
          { header:"Time", key:"timestamp" },
          { header:"Fraud Score", key:"fraudScore" },
          { header:"Status", key:"status" }
        ]}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onRowClick={(row) => navigate(`/transactions/${row.id}`)}
      />
    </div>
  );
};

export default TransactionList;
