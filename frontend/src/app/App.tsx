import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { PlaceholderPage } from '../features/dashboard/PlaceholderPage';

export function App() {
  const path = window.location.pathname;
  let page = <DashboardPage />;
  if (path === '/inventory') page = <PlaceholderPage title="Inventory" description="Manage products, monitor stock levels and keep your catalog organized." />;
  else if (path === '/stock-movements') page = <PlaceholderPage title="Stock movements" description="Track every stock entry and exit across your workspace." />;
  else if (path === '/suppliers') page = <PlaceholderPage title="Suppliers" description="Supplier management will be connected when the backend module is available." />;
  else if (path === '/users') page = <PlaceholderPage title="Users & access" description="Manage workspace members and access levels." />;
  else if (path === '/reports') page = <PlaceholderPage title="Reports" description="Inventory reporting will be connected when the backend module is available." />;
  else if (path === '/settings') page = <PlaceholderPage title="Settings" description="Workspace preferences and account settings." />;
  return <AppShell>{page}</AppShell>;
}
