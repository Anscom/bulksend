import { describe, it, expect } from 'vitest';
import { generateUnsubscribeToken, verifyUnsubscribeToken } from '../lib/unsubscribe.js';

const SECRET = 'test-secret-32-chars-long-enough';
const WORKSPACE = 'ws_abc123';
const EMAIL = 'user@example.com';

describe('generateUnsubscribeToken', () => {
  it('produces a deterministic base64url token', () => {
    const t1 = generateUnsubscribeToken(WORKSPACE, EMAIL, SECRET);
    const t2 = generateUnsubscribeToken(WORKSPACE, EMAIL, SECRET);
    expect(t1).toBe(t2);
    expect(t1).toMatch(/^[A-Za-z0-9_-]+$/); // base64url charset
  });

  it('produces different tokens for different workspaces', () => {
    const t1 = generateUnsubscribeToken('ws_aaa', EMAIL, SECRET);
    const t2 = generateUnsubscribeToken('ws_bbb', EMAIL, SECRET);
    expect(t1).not.toBe(t2);
  });

  it('produces different tokens for different emails', () => {
    const t1 = generateUnsubscribeToken(WORKSPACE, 'a@x.com', SECRET);
    const t2 = generateUnsubscribeToken(WORKSPACE, 'b@x.com', SECRET);
    expect(t1).not.toBe(t2);
  });

  it('produces different tokens for different secrets', () => {
    const t1 = generateUnsubscribeToken(WORKSPACE, EMAIL, 'secret-a');
    const t2 = generateUnsubscribeToken(WORKSPACE, EMAIL, 'secret-b');
    expect(t1).not.toBe(t2);
  });
});

describe('verifyUnsubscribeToken', () => {
  it('accepts a valid token', () => {
    const token = generateUnsubscribeToken(WORKSPACE, EMAIL, SECRET);
    expect(verifyUnsubscribeToken(WORKSPACE, EMAIL, token, SECRET)).toBe(true);
  });

  it('rejects a tampered token', () => {
    const token = generateUnsubscribeToken(WORKSPACE, EMAIL, SECRET);
    const tampered = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A');
    expect(verifyUnsubscribeToken(WORKSPACE, EMAIL, tampered, SECRET)).toBe(false);
  });

  it('rejects a token for a different email', () => {
    const token = generateUnsubscribeToken(WORKSPACE, 'other@example.com', SECRET);
    expect(verifyUnsubscribeToken(WORKSPACE, EMAIL, token, SECRET)).toBe(false);
  });

  it('rejects a token generated with the wrong secret', () => {
    const token = generateUnsubscribeToken(WORKSPACE, EMAIL, 'wrong-secret');
    expect(verifyUnsubscribeToken(WORKSPACE, EMAIL, token, SECRET)).toBe(false);
  });

  it('rejects an empty token without throwing', () => {
    expect(verifyUnsubscribeToken(WORKSPACE, EMAIL, '', SECRET)).toBe(false);
  });
});
