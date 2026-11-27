import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import type { User } from '../../lib/types';
import { useI18n, TranslateTree } from '../../lib/i18n';
import { updatePreferences, usePreferences } from '../../lib/preferences';
import { stockflowApi } from '../../lib/stockflow-api';

type Theme = 'light' | 'dark';
type FontScale = 'normal' | 'large' | 'extra';

export function SettingsPage({ user }: { user: User }) {
  const preferences = usePreferences();
  const { language, setLanguage, dateFormat, setDateFormat } = useI18n();
  const [languageSaveState, setLanguageSaveState] = useState<'saved' | 'saving' | 'error'>('saved');

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.dataset.fontScale = preferences.fontScale;
  }, [preferences.theme, preferences.fontScale]);

  const update = <K extends 'theme' | 'fontScale'>(key: K, value: K extends 'theme' ? Theme : FontScale) => {
    updatePreferences({ [key]: value } as Pick<typeof preferences, K>);
  };

  const handleLanguageChange = async (next: 'pt-BR' | 'en') => {
    const previous = language;
    if (next === previous) return;
    setLanguage(next);
    setLanguageSaveState('saving');
    try {
      await stockflowApi.updateLanguagePreference(next);
      setLanguageSaveState('saved');
    } catch {
      setLanguage(previous);
      setLanguageSaveState('error');
    }
  };

  const labels = language === 'pt-BR'
    ? { eyebrow: 'PREFERÊNCIAS / WORKSPACE', title: 'Configurações', description: 'Personalize a aparência e as preferências da sua experiência no StockFlow.', appearance: 'Aparência', appearanceDesc: 'Escolha como o StockFlow será exibido.', theme: 'Tema', light: 'Claro', dark: 'Escuro', size: 'Tamanho do texto', sizeDesc: 'Aumenta somente as letras para facilitar a leitura, sem ampliar os componentes.', normal: 'Padrão', large: 'Grande', extra: 'Muito grande', language: 'Idioma', languageDesc: 'Salva o idioma na sua conta e sincroniza a preferência entre dispositivos.', dateFormat: 'Formato de data', dateFormatDesc: 'Escolha como as datas serão exibidas em todo o sistema.', dmy: 'Dia / mês / ano', mdy: 'Mês / dia / ano', account: 'Conta atual', role: 'Perfil de acesso', saved: 'Preferência de idioma salva na sua conta.' }
    : { eyebrow: 'PREFERENCES / WORKSPACE', title: 'Settings', description: 'Customize the appearance and preferences of your StockFlow experience.', appearance: 'Appearance', appearanceDesc: 'Choose how StockFlow is displayed.', theme: 'Theme', light: 'Light', dark: 'Dark', size: 'Text size', sizeDesc: 'Enlarges text only for easier reading without scaling interface components.', normal: 'Default', large: 'Large', extra: 'Extra large', language: 'Language', languageDesc: 'Saves your language to your account and syncs it across devices.', dateFormat: 'Date format', dateFormatDesc: 'Choose how dates are displayed throughout the system.', dmy: 'Day / month / year', mdy: 'Month / day / year', account: 'Current account', role: 'Access role', saved: 'Language preference saved to your account.' };

  return <TranslateTree><div className="page-stack settings-page">
    <PageHeader eyebrow={labels.eyebrow} title={labels.title} description={labels.description} />
    <Card className="settings-card">
      <div className="settings-section-heading"><span className="settings-icon"><Icon name="settings" size={18}/></span><div><h2>{labels.appearance}</h2><p>{labels.appearanceDesc}</p></div></div>
      <div className="settings-option">
        <div><strong>{labels.theme}</strong><span>{preferences.theme === 'dark' ? labels.dark : labels.light}</span></div>
        <div className="settings-choice-group" role="group" aria-label={labels.theme}>
          <button type="button" className={preferences.theme === 'light' ? 'settings-choice settings-choice-active' : 'settings-choice'} onClick={() => update('theme', 'light')}><Icon name="sun" size={16}/>{labels.light}</button>
          <button type="button" className={preferences.theme === 'dark' ? 'settings-choice settings-choice-active' : 'settings-choice'} onClick={() => update('theme', 'dark')}><Icon name="moon" size={16}/>{labels.dark}</button>
        </div>
      </div>
      <div className="settings-option">
        <div><strong>{labels.size}</strong><span>{labels.sizeDesc}</span></div>
        <div className="settings-choice-group" role="group" aria-label={labels.size}>
          {(['normal', 'large', 'extra'] as const).map((value) => <button key={value} type="button" className={preferences.fontScale === value ? 'settings-choice settings-choice-active' : 'settings-choice'} onClick={() => update('fontScale', value)}>{value === 'normal' ? labels.normal : value === 'large' ? labels.large : labels.extra}</button>)}
        </div>
      </div>
      <div className="settings-option">
        <div><strong>{labels.language}</strong><span>{labels.languageDesc}</span></div>
        <select className="settings-select" value={language} onChange={(event) => void handleLanguageChange(event.target.value as 'pt-BR' | 'en')} aria-label={labels.language}>
          <option value="pt-BR">Português (Brasil)</option><option value="en">English</option>
        </select>
      </div>
      <div className="settings-option">
        <div><strong>{labels.dateFormat}</strong><span>{labels.dateFormatDesc}</span></div>
        <select className="settings-select" value={dateFormat} onChange={(event) => { const next = event.target.value as 'DMY' | 'MDY'; setDateFormat(next); updatePreferences({ dateFormat: next }); }} aria-label={labels.dateFormat}>
          <option value="DMY">{labels.dmy}</option><option value="MDY">{labels.mdy}</option>
        </select>
      </div>
      <p className="settings-saved" role="status"><Icon name="check" size={14}/>{languageSaveState === 'saving' ? (language === 'en' ? 'Saving language preference...' : 'Salvando preferência de idioma...') : languageSaveState === 'error' ? (language === 'en' ? 'Could not save language preference. Your previous choice was restored.' : 'Não foi possível salvar o idioma. A preferência anterior foi restaurada.') : labels.saved}</p>
    </Card>
    <Card className="settings-card settings-account-card">
      <div className="settings-section-heading"><span className="settings-icon"><Icon name="users" size={18}/></span><div><h2>{labels.account}</h2><p><span data-i18n-ignore="true">{user.name}</span> · <span data-i18n-ignore="true">{user.email}</span></p></div></div>
      <div className="settings-account-role"><span>{labels.role}</span><strong>{user.role === 'ADMIN' ? (language === 'pt-BR' ? 'Administrador' : 'Administrator') : user.role === 'MANAGER' ? (language === 'pt-BR' ? 'Gerente' : 'Manager') : (language === 'pt-BR' ? 'Operador' : 'Operator')}</strong></div>
    </Card>
  </div></TranslateTree>;
}
