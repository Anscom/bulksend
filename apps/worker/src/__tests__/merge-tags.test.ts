import { describe, it, expect } from 'vitest';
import { escapeHtml, resolveMergeTags } from '../lib/merge-tags.js';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<b>bold</b>')).toBe('&lt;b&gt;bold&lt;/b&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('escapes a full XSS payload', () => {
    const payload = '<script>alert("xss")</script>';
    const escaped = escapeHtml(payload);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('leaves safe text unchanged', () => {
    expect(escapeHtml('Hello world')).toBe('Hello world');
  });
});

describe('resolveMergeTags', () => {
  const vars = { first_name: 'Alice', email: 'alice@example.com' };

  it('replaces a simple tag', () => {
    expect(resolveMergeTags('Hello {{ first_name }}!', vars)).toBe('Hello Alice!');
  });

  it('replaces multiple tags', () => {
    expect(resolveMergeTags('{{ first_name }} <{{ email }}>', vars)).toBe('Alice <alice@example.com>');
  });

  it('replaces unknown tags with empty string', () => {
    expect(resolveMergeTags('{{ unknown }}', vars)).toBe('');
  });

  it('does NOT escape in text mode (html=false)', () => {
    const malicious = '<script>alert(1)</script>';
    const result = resolveMergeTags('{{ name }}', { name: malicious });
    expect(result).toBe(malicious);
  });

  it('escapes HTML special chars in html mode', () => {
    const malicious = '<script>alert(1)</script>';
    const result = resolveMergeTags('{{ name }}', { name: malicious }, true);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('escapes user-supplied data in html mode while leaving template HTML intact', () => {
    const template = '<p>Hello {{ first_name }}</p>';
    const result = resolveMergeTags(template, { first_name: '<b>bold</b>' }, true);
    expect(result).toBe('<p>Hello &lt;b&gt;bold&lt;/b&gt;</p>');
  });

  it('handles tags with extra whitespace', () => {
    expect(resolveMergeTags('{{  first_name  }}', vars)).toBe('Alice');
  });
});
