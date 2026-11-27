import { Icon, type IconName } from '../ui/Icon';
import { useState, type MouseEvent, type ReactNode } from 'react';
import type { User } from '../../lib/types';
import { cn } from '../../lib/cn';
import { updatePreferences, usePreferences } from '../../lib/preferences';
import { translate, useI18n, UserText } from '../../lib/i18n';

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
  const preferences = usePreferences();
  const { language } = useI18n();
  const [profileOpen, setProfileOpen] = useState(false);
  const allowedNavigation = navigation.filter((item) => {
    if (item.to === '/users') return user.role === 'ADMIN';
    if (item.to === '/reports') return user.role !== 'OPERATOR';
    return true;
  });
  const currentLabel = allowedNavigation.find((item) => item.to === currentPath)?.label ?? (currentPath === '/settings' ? 'Settings' : 'Overview');
  const navigateFromClick = (event: MouseEvent<HTMLAnchorElement>, to: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(to);
    setMobileOpen(false);
  };

  return (
    <div className={cn("app-shell", preferences.sidebarCollapsed && "sidebar-collapsed")}>
      {mobileOpen && <button className="mobile-scrim" aria-label={translate("Fechar navegação", language)} onClick={() => setMobileOpen(false)} />}
      <aside className={cn('sidebar', mobileOpen && 'sidebar-open')}>
        <div className="brand-lockup">
          <div className="brand-ident"><div className="brand-mark"><Icon name="activity" size={19} strokeWidth={2.5} /></div>
          <div className="brand-copy"><span>StockFlow</span><small>{translate("INVENTORY MANAGEMENT", language)}</small></div></div><button className="sidebar-collapse-toggle icon-button" type="button" onClick={() => updatePreferences({ sidebarCollapsed: !preferences.sidebarCollapsed })} aria-label={translate(preferences.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar", language)} title={translate(preferences.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar", language)}><Icon name="panel-left" size={17}/></button>
          <button className="sidebar-close icon-button" onClick={() => setMobileOpen(false)} aria-label={translate("Fechar menu", language)}>×</button>
        </div>
        <div className="workspace-label">{translate("WORKSPACE", language)}</div>
        <nav className="primary-nav" aria-label={translate("Navegação principal", language)}>
          {allowedNavigation.map(({ label, to, icon }) => {
            const active = currentPath === to || (to !== '/' && currentPath.startsWith(to));
            return <a key={to} href={to} onClick={(event) => navigateFromClick(event, to)} className={cn('nav-link', active && 'nav-link-active')} title={translate(label, language)} aria-current={active ? 'page' : undefined}>
              <Icon name={icon} size={18} strokeWidth={1.8} /><span>{translate(label, language)}</span>
            </a>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          <a href="/settings" onClick={(event) => navigateFromClick(event, '/settings')} className={cn('nav-link', currentPath === '/settings' && 'nav-link-active')}>
            <Icon name="settings" size={18} strokeWidth={1.8} /><span>{translate("Settings", language)}</span>
          </a>
          <button className="nav-link help-link"><Icon name="help" size={18} strokeWidth={1.8} /><span>{translate("Help & support", language)}</span></button>
          <div className="sidebar-user">
            <div className="avatar avatar-indigo">{user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div>
            <div className="user-copy"><UserText as="strong">{user.name}</UserText><span>{translate(user.role === 'ADMIN' ? 'Administrator' : user.role === 'MANAGER' ? 'Manager' : 'Operator', language)}</span></div>
            <button className="user-menu icon-button" aria-label={translate("Sair da conta", language)} title={translate("Sair da conta", language)} onClick={() => void onLogout()}><Icon name="chevron-down" size={16} /></button>
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label={translate("Abrir navegação", language)} onClick={() => setMobileOpen(true)}><span className="hamburger">☰</span></button>
          <div className="breadcrumbs"><span>{translate("Workspace", language)}</span><span className="breadcrumb-slash">/</span><strong>{translate(currentLabel, language)}</strong></div>
          <div className="topbar-actions">
            <button className="global-search" aria-label={translate("Pesquisar...", language)}><Icon name="search" size={16} /><span>{translate("Search anything...", language)}</span><kbd>⌘ K</kbd></button>
            <button className="icon-button notification-button" aria-label={translate("Notificações", language)}><Icon name="bell" size={18} /></button>
            <div className="topbar-divider" />
            <div className="profile-menu-wrap">
              <button className="topbar-profile" aria-label={translate("Menu da conta", language)} aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}><div className="avatar avatar-indigo">{user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div><Icon name="chevron-down" size={15} /></button>
              {profileOpen && <div className="profile-dropdown">
                <div className="profile-dropdown-user"><UserText as="strong">{user.name}</UserText><UserText as="span">{user.email}</UserText></div>
                <button type="button" onClick={() => { onNavigate('/settings'); setProfileOpen(false); }}><Icon name="settings" size={15}/>{translate("Settings", language)}</button>
                <button type="button" onClick={() => { setProfileOpen(false); void onLogout(); }}><Icon name="log-out" size={15}/>{translate("Sair da conta", language)}</button>
              </div>}
            </div>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <footer className="app-footer"><span>© 2026 StockFlow</span><span>{translate("Inventory management, made clearer.", language)}</span></footer>
      </div>
    </div>
  );
}
