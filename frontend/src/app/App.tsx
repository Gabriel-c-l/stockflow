import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { PlaceholderPage } from '../features/dashboard/PlaceholderPage';
import { CategoriesPage } from '../features/categories/CategoriesPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { StockMovementsPage } from '../features/stock-movements/StockMovementsPage';
import { LoginPage } from '../features/auth/LoginPage';
import { stockflowApi } from '../lib/stockflow-api';
import type { User } from '../lib/types';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    stockflowApi.currentUser()
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    window.history.replaceState({}, '', '/');
  };

  const handleLogout = async () => {
    try {
      await stockflowApi.logout();
    } finally {
      setUser(null);
      window.history.replaceState({}, '', '/login');
    }
  };

  if (checkingSession) {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        <span className="auth-loading-mark">S</span>
        <span>Loading your workspace...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const path = window.location.pathname;
  let page = <DashboardPage />;
  if (path === '/categories') page = <CategoriesPage />;
  else if (path === '/inventory') page = <ProductsPage />;
  else if (path === '/stock-movements') page = <StockMovementsPage />;
  else if (path === '/suppliers') page = <PlaceholderPage title="Suppliers" description="Supplier management will be connected when the backend module is available." />;
  else if (path === '/users') page = <PlaceholderPage title="Users & access" description="Manage workspace members and access levels." />;
  else if (path === '/reports') page = <PlaceholderPage title="Reports" description="Inventory reporting will be connected when the backend module is available." />;
  else if (path === '/settings') page = <PlaceholderPage title="Settings" description="Workspace preferences and account settings." />;

  return (
    <AppShell user={user} onLogout={handleLogout}>
      {page}
    </AppShell>
  );
}
