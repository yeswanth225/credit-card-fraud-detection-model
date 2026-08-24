import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TransactionDetail from './pages/TransactionDetail';
import Metrics from './pages/Metrics';
import { COLORS, LAYOUT } from './constants/design';

function App() {
  const [isDark, setIsDark] = useState(() => {
    // Respect prefers-color-scheme on first load
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    // Check localStorage for user preference
    const stored = localStorage.getItem('theme-mode');
    return stored === 'dark';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('auth-token');
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('user-role') || 'analyst';
  });

  // Update DOM and localStorage when theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
    // Update color-scheme CSS property for native elements
    root.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  const handleLogin = (role: string) => {
    // In a real app, this would call the API
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem('auth-token', 'mock-token-' + Date.now());
    localStorage.setItem('user-role', role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('analyst');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-role');
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} isDark={isDark} onToggleTheme={toggleTheme} />;
  }

  return (
    <Router>
      <Layout
        userRole={userRole}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions/:id" element={<TransactionDetail />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
