import { describe, it, expect } from 'vitest';
import { parseFilters } from '../lib/mappers.js';

describe('parseFilters', () => {
  it('returns an array unchanged', () => {
    const input = [{ field: 'status', operator: 'eq', value: 'subscribed' }];
    expect(parseFilters(input as never)).toEqual(input);
  });

  it('parses a JSON-serialised string', () => {
    const filters = [{ field: 'email', operator: 'contains', value: '@example.com' }];
    expect(parseFilters(JSON.stringify(filters))).toEqual(filters);
  });

  it('returns [] for null', () => {
    expect(parseFilters(null)).toEqual([]);
  });

  it('returns [] for a number (unexpected DB value)', () => {
    expect(parseFilters(42)).toEqual([]);
  });

  it('returns [] for a boolean', () => {
    expect(parseFilters(true)).toEqual([]);
  });

  it('preserves nested filter values', () => {
    const input = [
      { field: 'createdAt', operator: 'gt', value: '2024-01-01' },
      { field: 'status', operator: 'in', value: ['subscribed', 'bounced'] },
    ];
    expect(parseFilters(input as never)).toEqual(input);
  });
});
