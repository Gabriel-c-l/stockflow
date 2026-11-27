import { useSyncExternalStore } from 'react';

export type Language = 'pt-BR' | 'en';
export type DateFormat = 'DMY' | 'MDY';
export type Theme = 'light' | 'dark';
export type FontScale = 'normal' | 'large' | 'extra';
export type Preferences = {
  theme: Theme;
  fontScale: FontScale;
  language: Language;
  dateFormat: DateFormat;
  sidebarCollapsed: boolean;
};

const STORAGE_KEY = 'stockflow.preferences';
const defaults: Preferences = {
  theme: 'light',
  fontScale: 'normal',
  language: 'en',
  dateFormat: 'DMY',
  sidebarCollapsed: false,
};

function load(): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Preferences>;
    return {
      theme: value.theme === 'dark' ? 'dark' : 'light',
      fontScale: value.fontScale === 'large' || value.fontScale === 'extra' ? value.fontScale : 'normal',
      language: value.language === 'pt-BR' ? 'pt-BR' : 'en',
      dateFormat: value.dateFormat === 'MDY' ? 'MDY' : 'DMY',
      sidebarCollapsed: value.sidebarCollapsed === true,
    };
  } catch { return defaults; }
}

let current = typeof localStorage === 'undefined' ? defaults : load();
const listeners = new Set<() => void>();

function applyDocumentPreferences() {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = current.theme;
  document.documentElement.dataset.fontScale = current.fontScale;
  document.documentElement.lang = current.language;
  document.documentElement.dataset.language = current.language;
  document.documentElement.dataset.dateFormat = current.dateFormat;
}

function publish() {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  applyDocumentPreferences();
  listeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  applyDocumentPreferences();
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) { current = load(); applyDocumentPreferences(); listeners.forEach((listener) => listener()); }
  });
}

export function getPreferences() { return current; }
export function updatePreferences(patch: Partial<Preferences>) { current = { ...current, ...patch }; publish(); }
export function usePreferences() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => current,
    () => defaults,
  );
}


export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  const locale = current.language === 'en' ? 'en-US' : 'pt-BR';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const format: Intl.DateTimeFormatOptions = { ...options, day: '2-digit', month: '2-digit', year: 'numeric' };
  // Numeric ordering is explicit so the chosen preference wins independently of browser locale.
  const parts = new Intl.DateTimeFormat(locale, format).formatToParts(date);
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  return current.dateFormat === 'MDY' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

export function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const datePart = formatDate(date);
  const timePart = new Intl.DateTimeFormat(current.language === 'en' ? 'en-US' : 'pt-BR', {
    hour: '2-digit', minute: '2-digit', hour12: current.language === 'en',
  }).format(date);
  return `${datePart}, ${timePart}`;
}
export function formatWeekday(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(current.language === 'en' ? 'en-US' : 'pt-BR', { weekday: 'short' }).format(date).replace('.', '');
}
