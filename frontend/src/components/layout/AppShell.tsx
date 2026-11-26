import { Icon, type IconName } from '../ui/Icon';
import { useState, type ReactNode } from 'react';
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

export function AppShell({ children, user, onLogout }: { children: ReactNode; user: User; onLogout: () => Promise<void> }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPath = window.location.pathname;
  const currentLabel = navigation.find((item) => item.to === currentPath)?.label ?? (currentPath === '/settings' ? 'Settings' : 'Overview');

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={cn('sidebar', mobileOpen && 'sidebar-open')}>
        <div className="brand-lockup">
          <div className="brand-mark"><Icon name="activity" size={19} strokeWidth={2.5} /></div>
          <div className="brand-copy"><span>StockFlow</span><small>INVENTORY MANAGEMENT</small></div>
          <button className="sidebar-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Close menu">×</button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map(({ label, to, icon }) => {
            const active = currentPath === to || (to !== '/' && currentPath.startsWith(to));
            return <a key={to} href={to} onClick={() => setMobileOpen(false)} className={cn('nav-link', active && 'nav-link-active')}>
              <Icon name={icon} size={18} strokeWidth={1.8} /><span>{label}</span>
              {label === 'Stock movements' && <span className="nav-indicator" />}
            </a>;
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          <a href="/settings" className={cn('nav-link', currentPath === '/settings' && 'nav-link-active')}>
            <Icon name="settings" size={18} strokeWidth={1.8} /><span>Settings</span>
          </a>
          <button className="nav-link help-link"><Icon name="help" size={18} strokeWidth={1.8} /><span>Help & support</span></button>
          <div className="sidebar-user">
            <div className="avatar avatar-indigo">{user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div>
            <div className="user-copy"><strong>{user.name}</strong><span>{user.role === "ADMIN" ? "Administrator" : user.role === "MANAGER" ? "Manager" : "Operator"}</span></div>
            <button className="user-menu icon-button" aria-label="Sign out" title="Sign out" onClick={() => void onLogout()}><Icon name="chevron-down" size={16} /></button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><span className="hamburger">☰</span></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{currentLabel}</strong></div>
          <div className="topbar-actions">
            <button className="global-search" aria-label="Search"><Icon name="search" size={16} /><span>Search anything...</span><kbd>⌘ K</kbd></button>
            <button className="icon-button notification-button" aria-label="Notifications"><Icon name="bell" size={18} /><i /></button>
            <div className="topbar-divider" />
            <button className="topbar-profile" aria-label="Open profile menu"><div className="avatar avatar-indigo">{user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div><Icon name="chevron-down" size={15} /></button>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <footer className="app-footer"><span>© 2026 StockFlow</span><span>Inventory management, made clearer.</span></footer>
      </div>
    </div>
  );
}
