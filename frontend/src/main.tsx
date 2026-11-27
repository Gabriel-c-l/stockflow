import React from 'react';
import { I18nProvider, TranslateTree } from './lib/i18n';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/globals.css';
import './styles/stock-movements-fix.css';
import './styles/users.css';
import './styles/settings.css';
import './styles/accessibility-theme.css';
import './styles/visual-consistency.css';
import './styles/auth-theme.css';
import './styles/sidebar-collapse.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider><TranslateTree><App /></TranslateTree></I18nProvider>
  </React.StrictMode>,
);



