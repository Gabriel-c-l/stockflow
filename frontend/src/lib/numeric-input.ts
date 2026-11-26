import type { KeyboardEvent } from 'react';

const editingKeys = new Set(['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

/** Blocks non-numeric keystrokes on desktop. Input handlers must still sanitize paste/autofill. */
export function blockNonNumericKey(event: KeyboardEvent<HTMLInputElement>, decimal = false) {
  if (event.ctrlKey || event.metaKey || event.altKey || editingKeys.has(event.key)) return;
  if (/^\d$/.test(event.key)) return;
  if (decimal && (event.key === ',' || event.key === '.') && !/[,.]/.test(event.currentTarget.value)) return;
  event.preventDefault();
}

export function digitsOnly(value: string, maxDigits = Number.MAX_SAFE_INTEGER) {
  return value.replace(/\D/g, '').slice(0, maxDigits);
}

export function decimalOnly(value: string, maxDecimals = 2) {
  const normalized = value.replace(/[^\d,.]/g, '').replace(',', '.');
  const [integer = '', ...fractionParts] = normalized.split('.');
  const fraction = fractionParts.join('').slice(0, maxDecimals);
  return fractionParts.length ? `${integer}.${fraction}` : integer;
}
