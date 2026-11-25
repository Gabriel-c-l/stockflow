import { describe, expect, it } from 'vitest';
import { cn } from '../src/lib/cn';

describe('cn', () => {
  it('joins truthy class names in order', () => {
    expect(cn('sidebar', false, undefined, 'sidebar-open')).toBe('sidebar sidebar-open');
  });

  it('returns an empty string when no class is provided', () => {
    expect(cn()).toBe('');
  });
});
