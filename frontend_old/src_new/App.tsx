import { useState } from 'react';
import { Sidebar, type PageId } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Dashboard } from '@/pages/Dashboard';
import { DetectFraud } from '@/pages/DetectFraud';
import { TransactionHistory } from '@/pages/TransactionHistory';
import { Analytics } from '@/pages/Analytics';
import { ModelPerformance } from '@/pages/ModelPerformance';

const PAGE_META: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Real-time fraud detection overview' },
  detect: { title: 'Detect Fraud', subtitle: 'Analyze a transaction for fraud risk' },
  history: { title: 'Transactions', subtitle: 'Search and review transaction history' },
  analytics: { title: 'Analytics', subtitle: 'Fraud trends and category insights' },
  model: { title: 'Model Performance', subtitle: 'Detection model accuracy and metrics' },
};

function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleNavigate = (p: PageId) => {
    setPage(p);
    setMobileNavOpen(false);
  };

  const meta = PAGE_META[page];

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar
        current={page}
        onNavigate={handleNavigate}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="lg:pl-60">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        <main className="animate-fade-in" key={page}>
          {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
          {page === 'detect' && <DetectFraud />}
          {page === 'history' && <TransactionHistory />}
          {page === 'analytics' && <Analytics />}
          {page === 'model' && <ModelPerformance />}
        </main>
      </div>
    </div>
  );
}

export default App;
