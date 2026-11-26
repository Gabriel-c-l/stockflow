import { Icon, type IconName } from '../ui/Icon';
import { useState, type MouseEvent, type ReactNode } from 'react';
import type { User } from '../../lib/types';
import { cn } from '../../lib/cn';

const navigation = [
  { label: 'Dashboard', to: '/', icon: 'dashboard' as IconName },
  { label: 'Inventory', to: '/inventory', icon: 'package' as IconName },
  { label: 'Categories', to: '/categories', icon: 'boxes' as IconName },
  { label: 'Stock movements', to: '/stock-movements', icon: 'activity' as IconName },
  { label: 'Suppliers', to: '/suppliers', icon: 'truck' as IconName },
  { label: 'Users & access', to: '/users', icon: 'users' as IconName },
  { label: 'Reports', to: '/reports', icon: 'command' as IconName },
];

type AppShellProps = {
  children: ReactNode;
  user: User;
  currentPath: string;
  onNavigate: (to: string) => void;
  onLogout: () => Promise<void>;
};

export function AppShell({ children, user, currentPath, onNavigate, onLogout }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentLabel = navigation.find((item) => item.to === currentPath)?.label ?? (currentPath === '/settings' ? 'Settings' : 'Overview');
  const navigateFromClick = (event: MouseEvent<HTMLAnchorElement>, to: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(to);
    setMobileOpen(false);
  };

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="Fechar navegação" onClick={() => setMobileOpen(false)} />}
      <aside className={cn('sidebar', mobileOpen && 'sidebar-open')}>
        <div className="brand-lockup">
          <div className="brand-mark"><Icon name="activity" size={19} strokeWidth={2.5} /></div>
          <div className="brand-copy"><span>StockFlow</span><small>INVENTORY MANAGEMENT</small></div>
          <button className="sidebar-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">×</button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Navegação principal">
          {navigation.map(({ label, to, icon }) => {
            const active = currentPath === to || (to !== '/' && currentPath.startsWith(to));
            return <a key={to} href={to} onClick={(event) => navigateFromClick(event, to)} className={cn('nav-link', active && 'nav-link-active')} aria-current={active ? 'page' : undefined}>
              <Icon name={icon} size={18} strokeWidth={1.8} /><span>{label}</span>
            </a>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          <a href="/settings" onClick={(event) => navigateFromClick(event, '/settings')} className={cn('nav-link', currentPath === '/settings' && 'nav-link-active')}>
            <Icon name="settings" size={18} strokeWidth={1.8} /><span>Settings</span>
          </a>
          <button className="nav-link help-link"><Icon name="help" size={18} strokeWidth={1.8} /><span>Help & support</span></button>
          <div className="sidebar-user">
            <div className="avatar avatar-indigo">{user.name.split(/\\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div>
            <div className="user-copy"><strong>{user.name}</strong><span>{user.role === 'ADMIN' ? 'Administrator' : user.role === 'MANAGER' ? 'Manager' : 'Operator'}</span></div>
            <button className="user-menu icon-button" aria-label="Sair" title="Sair" onClick={() => void onLogout()}><Icon name="chevron-down" size={16} /></button>
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Abrir navegação" onClick={() => setMobileOpen(true)}><span className="hamburger">☰</span></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{currentLabel}</strong></div>
          <div className="topbar-actions">
            <button className="global-search" aria-label="Pesquisar"><Icon name="search" size={16} /><span>Search anything...</span><kbd>⌘ K</kbd></button>
            <button className="icon-button notification-button" aria-label="Notificações"><Icon name="bell" size={18} /></button>
            <div className="topbar-divider" />
            <button className="topbar-profile" aria-label="Perfil"><div className="avatar avatar-indigo">{user.name.split(/\\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div><Icon name="chevron-down" size={15} /></button>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <footer className="app-footer"><span>© 2026 StockFlow</span><span>Inventory management, made clearer.</span></footer>
      </div>
    </div>
  );
}
