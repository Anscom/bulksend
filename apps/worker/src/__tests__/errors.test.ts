import { describe, it, expect } from 'vitest';
import { classifyError, WorkerError } from '../lib/errors.js';

describe('classifyError', () => {
  it('returns the kind from a WorkerError directly', () => {
    expect(classifyError(new WorkerError('permanent', 'bad email'))).toBe('permanent');
    expect(classifyError(new WorkerError('throttled', 'rate limit'))).toBe('throttled');
    expect(classifyError(new WorkerError('auth', 'bad key'))).toBe('auth');
    expect(classifyError(new WorkerError('exhausted', 'max retries'))).toBe('exhausted');
  });

  it('classifies 429 as throttled', () => {
    expect(classifyError({ code: 429 })).toBe('throttled');
  });

  it('classifies 401 as auth', () => {
    expect(classifyError({ code: 401 })).toBe('auth');
  });

  it('classifies 403 as auth', () => {
    expect(classifyError({ code: 403 })).toBe('auth');
  });

  it('classifies 5xx as transient', () => {
    expect(classifyError({ code: 500 })).toBe('transient');
    expect(classifyError({ code: 502 })).toBe('transient');
    expect(classifyError({ code: 503 })).toBe('transient');
  });

  it('classifies 400 as permanent', () => {
    expect(classifyError({ code: 400 })).toBe('permanent');
  });

  it('classifies 422 as permanent', () => {
    expect(classifyError({ code: 422 })).toBe('permanent');
  });

  it('classifies unknown errors as transient', () => {
    expect(classifyError(new Error('network timeout'))).toBe('transient');
    expect(classifyError(null)).toBe('transient');
    expect(classifyError(undefined)).toBe('transient');
    expect(classifyError('string error')).toBe('transient');
  });
});
