import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { PlaceholderPage } from '../features/dashboard/PlaceholderPage';
import { CategoriesPage } from '../features/categories/CategoriesPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { StockMovementsPage } from '../features/stock-movements/StockMovementsPage';
import { SuppliersPage } from '../features/suppliers/SuppliersPage';
import { LoginPage } from '../features/auth/LoginPage';
import { UsersPage } from '../features/users/UsersPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { stockflowApi } from '../lib/stockflow-api';
import type { User } from '../lib/types';
import { updatePreferences } from '../lib/preferences';
import { TranslateTree } from '../lib/i18n';

function readPath() {
  return window.location.pathname || '/';
}

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [path, setPath] = useState(readPath);

  useEffect(() => {
    const handlePopState = () => setPath(readPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let active = true;
    stockflowApi.currentUser()
      .then(({ user: currentUser }) => { if (active) { setUser(currentUser); updatePreferences({ language: currentUser.language === 'pt-BR' ? 'pt-BR' : 'en' }); } })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

  const navigate = (to: string, replace = false) => {
    if (to === path) return;
    if (replace) window.history.replaceState({}, '', to);
    else window.history.pushState({}, '', to);
    setPath(to);
  };

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    updatePreferences({ language: authenticatedUser.language === 'pt-BR' ? 'pt-BR' : 'en' });
    navigate('/', true);
  };

  const handleLogout = async () => {
    try { await stockflowApi.logout(); }
    finally {
      setUser(null);
      navigate('/login', true);
    }
  };

  if (checkingSession) {
    return <TranslateTree><div className="auth-loading" role="status" aria-live="polite"><span className="auth-loading-mark">S</span><span>Carregando seu ambiente...</span></div></TranslateTree>;
  }
  if (!user || path === '/login') return <LoginPage onLogin={handleLogin} />;

  let page = <DashboardPage />;
  if (path === '/categories') page = <CategoriesPage canManage={user.role !== 'OPERATOR'} />;
  else if (path === '/inventory') page = <ProductsPage canManage={user.role !== 'OPERATOR'} />;
  else if (path === '/stock-movements') page = <StockMovementsPage />;
  else if (path === '/suppliers') page = <SuppliersPage canManage={user.role !== 'OPERATOR'} />;
  else if (path === '/users') {
    if (user.role === 'ADMIN') page = <UsersPage currentUser={user} />;
    else navigate('/', true);
  }
  else if (path === '/reports') {
    if (user.role !== 'OPERATOR') page = <PlaceholderPage title="Reports" description="Inventory reporting will be connected when the backend module is available." />;
    else navigate('/', true);
  }
  else if (path === '/settings') page = <SettingsPage user={user} />;

  return <AppShell user={user} currentPath={path} onNavigate={navigate} onLogout={handleLogout}>{page}</AppShell>;
}
