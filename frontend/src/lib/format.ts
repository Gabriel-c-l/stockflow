import type { DateFormat } from './i18n';

function preferences() {
  try { return JSON.parse(localStorage.getItem('stockflow.preferences') || '{}') as { language?: string; dateFormat?: DateFormat }; }
  catch { return {}; }
}
function locale() { return preferences().language === 'en' ? 'en-US' : 'pt-BR'; }
function dateOptions(): Intl.DateTimeFormatOptions {
  return preferences().dateFormat === 'MDY'
    ? { month: '2-digit', day: '2-digit', year: 'numeric' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' };
}
export function formatCurrency(value: number, currency?: string, requestedLocale?: string): string {
  return new Intl.NumberFormat(requestedLocale || locale(), { style: 'currency', currency: currency || 'BRL' }).format(value);
}
export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat(locale(), dateOptions()).format(new Date(value));
}
export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat(locale(), { ...dateOptions(), hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
export function formatWeekday(value: string | Date): string {
  return new Intl.DateTimeFormat(locale(), { weekday: 'short' }).format(new Date(value)).replace('.', '');
}
