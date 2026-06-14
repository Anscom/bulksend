import { useState, useRef, useCallback } from 'react';
import { contactsApi } from '../../lib/api/contacts.js';

// ── parser ────────────────────────────────────────────────────────────────────

function detectDelimiter(text: string): string {
  const lines = text.split('\n').slice(0, 5);
  const tabs   = lines.reduce((n, l) => n + (l.match(/\t/g) ?? []).length, 0);
  const commas = lines.reduce((n, l) => n + (l.match(/,/g)  ?? []).length, 0);
  return tabs > commas ? '\t' : ',';
}

function parseSV(text: string): string[][] {
  const delim = detectDelimiter(text);
  const lines  = text.trim().split(/\r?\n/);

  // Simple CSV parser (handles quoted fields)
  function parseLine(line: string): string[] {
    const cells: string[] = [];
    let cur = '';
    let inQ  = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQ = false; }
        else { cur += ch; }
      } else {
        if (ch === '"') { inQ = true; }
        else if (ch === delim) { cells.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
    }
    cells.push(cur.trim());
    return cells;
  }

  return lines.map(parseLine);
}

// Convert tab-separated or parsed rows back to CSV for the backend
function rowsToCsv(headers: string[], dataRows: string[][]): string {
  function esc(v: string) {
    return v.includes(',') || v.includes('"') || v.includes('\n')
      ? `"${v.replace(/"/g, '""')}"` : v;
  }
  const head = headers.map(esc).join(',');
  const body = dataRows.map(r => headers.map((_, i) => esc(r[i] ?? '')).join(',')).join('\n');
  return `${head}\n${body}`;
}

// ── column auto-detection ─────────────────────────────────────────────────────

const FIELD_PATTERNS: Record<string, RegExp> = {
  email:     /e[_\s-]?mail/i,
  firstName: /first[_\s-]?name|given[_\s-]?name|forename/i,
  lastName:  /last[_\s-]?name|surname|family[_\s-]?name/i,
};

function autoMap(headers: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const used = new Set<string>();
  for (const [field, pattern] of Object.entries(FIELD_PATTERNS)) {
    const col = headers.find(h => pattern.test(h) && !used.has(h));
    if (col) { result[col] = field; used.add(col); }
  }
  return result;
}

// ── types ─────────────────────────────────────────────────────────────────────

type Step = 'input' | 'map' | 'done';
type FieldTarget = 'email' | 'firstName' | 'lastName' | '';

interface Props {
  onClose: () => void;
  onImported: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  email:     'Email *',
  firstName: 'First name',
  lastName:  'Last name',
};

// ── styles ───────────────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  display: 'block', width: '100%', padding: '8px 12px',
  borderRadius: 8, border: '1px solid var(--border)',
  fontSize: 13, background: 'var(--bg)', color: 'var(--text)',
  boxSizing: 'border-box', fontFamily: 'var(--mono)',
};

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  appearance: 'none',
  background: 'var(--bg)',
  cursor: 'pointer',
};

// ── component ─────────────────────────────────────────────────────────────────

export function ImportModal({ onClose, onImported }: Props) {
  const [step,      setStep]    = useState<Step>('input');
  const [rawText,   setRawText] = useState('');
  const [headers,   setHeaders] = useState<string[]>([]);
  const [preview,   setPreview] = useState<string[][]>([]);
  const [allRows,   setAllRows] = useState<string[][]>([]);
  const [mapping,   setMapping] = useState<Record<string, FieldTarget>>({});
  const [inputErr,  setInputErr]  = useState('');
  const [importing, setImporting] = useState(false);
  const [importErr, setImportErr] = useState('');
  const [result,    setResult]    = useState<{ imported: number; skipped: number } | null>(null);
  const [dragging,  setDragging]  = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  function loadText(text: string) {
    setRawText(text);
    setInputErr('');
  }

  function processText(text: string) {
    const parsed = parseSV(text.trim());
    if (parsed.length < 2) { setInputErr('Need at least a header row and one data row.'); return; }

    const hdrs = parsed[0]!;
    const data  = parsed.slice(1).filter(r => r.some(c => c.length > 0));
    if (data.length === 0) { setInputErr('No data rows found.'); return; }

    setHeaders(hdrs);
    setAllRows(data);
    setPreview(data.slice(0, 5));
    setMapping(autoMap(hdrs) as Record<string, FieldTarget>);
    setStep('map');
  }

  function handleFile(file: File) {
    if (!/\.(csv|txt|tsv)$/i.test(file.name)) {
      setInputErr('Please upload a .csv file. For Excel: File → Save As → CSV.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      loadText(text);
      processText(text);
    };
    reader.readAsText(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  function handleProceed() {
    if (!rawText.trim()) { setInputErr('Paste your data or upload a file.'); return; }
    processText(rawText);
  }

  function setFieldMapping(col: string, val: FieldTarget) {
    setMapping(prev => {
      const next = { ...prev };
      // un-assign that field from any other column first
      if (val) {
        for (const k of Object.keys(next)) {
          if (next[k] === val && k !== col) delete next[k];
        }
      }
      if (val) next[col] = val;
      else delete next[col];
      return next;
    });
  }

  async function handleImport() {
    const emailCol = Object.entries(mapping).find(([, v]) => v === 'email')?.[0];
    if (!emailCol) { setImportErr('You must map a column to Email.'); return; }

    // Build the mapping object for the API { colHeader: fieldName }
    const apiMapping: Record<string, string> = {};
    for (const [col, field] of Object.entries(mapping)) {
      if (field) apiMapping[col] = field;
    }

    const csv = rowsToCsv(headers, allRows);

    setImporting(true);
    setImportErr('');
    try {
      const res = await contactsApi.import(csv, apiMapping);
      setResult(res);
      setStep('done');
      onImported();
    } catch (e: unknown) {
      setImportErr(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  const emailMapped = Object.values(mapping).includes('email');

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-pop)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Import contacts</h3>
            <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 3 }}>
              {step === 'input' && 'Upload a CSV or paste from Excel'}
              {step === 'map'   && `${allRows.length.toLocaleString()} rows detected — map your columns`}
              {step === 'done'  && 'Import complete'}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={onClose}>✕</button>
        </div>

        {/* ── Step 1: input ── */}
        {step === 'input' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* drop zone */}
            <div
              style={{
                border: `1.5px dashed ${dragging ? 'var(--indigo)' : 'var(--line)'}`,
                borderRadius: 10, padding: '24px 20px', textAlign: 'center',
                background: dragging ? 'var(--indigo-tint)' : 'var(--bg-2)',
                transition: 'border-color .15s, background .15s', cursor: 'pointer',
              }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="1.5" style={{ marginBottom: 8 }}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
              </svg>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-2)' }}>Click to upload or drag &amp; drop</div>
              <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>CSV files only · For Excel: Save As → CSV</div>
              <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
              <span style={{ fontSize: 12, color: 'var(--slate)', fontFamily: 'var(--mono)' }}>or paste below</span>
              <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
            </div>

            <textarea
              style={{ ...INPUT_STYLE, fontFamily: 'var(--mono)', height: 140, resize: 'vertical' }}
              placeholder={'first_name\tlast_name\temail\nJane\tSmith\tjane@example.com\nJohn\tDoe\tjohn@example.com'}
              value={rawText}
              onChange={e => loadText(e.target.value)}
              spellCheck={false}
            />

            {inputErr && <p style={{ margin: 0, color: 'var(--red)', fontSize: 13 }}>{inputErr}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleProceed}>
                Preview &amp; map →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: map columns ── */}
        {step === 'map' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* column mapping */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>Map columns</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {headers.map(col => (
                  <div key={col} style={{ display: 'grid', gridTemplateColumns: '1fr 12px 160px', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 6, padding: '5px 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {col}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    <div style={{ position: 'relative' }}>
                      <select
                        style={SELECT_STYLE}
                        value={mapping[col] ?? ''}
                        onChange={e => setFieldMapping(col, e.target.value as FieldTarget)}
                      >
                        <option value="">— Skip —</option>
                        {Object.entries(FIELD_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* preview table */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>
                Preview <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--slate)', fontWeight: 400 }}>first {preview.length} of {allRows.length} rows</span>
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-2)' }}>
                      {headers.map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: mapping[h] ? 'var(--indigo-600)' : 'var(--slate-3)', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>
                          {h}{mapping[h] ? ` → ${mapping[h]}` : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: '1px solid var(--line-2)' }}>
                        {headers.map((_, ci) => (
                          <td key={ci} style={{ padding: '7px 12px', fontFamily: 'var(--mono)', color: 'var(--ink-2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row[ci] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {!emailMapped && (
              <p style={{ margin: 0, color: 'var(--amber)', fontSize: 13, background: 'var(--amber-tint)', padding: '8px 12px', borderRadius: 7 }}>
                Map one column to <strong>Email</strong> to continue.
              </p>
            )}
            {importErr && <p style={{ margin: 0, color: 'var(--red)', fontSize: 13 }}>{importErr}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setStep('input'); setImportErr(''); }}>← Back</button>
              <button className="btn btn-primary btn-sm" onClick={handleImport} disabled={!emailMapped || importing}>
                {importing ? 'Importing…' : `Import ${allRows.length.toLocaleString()} contacts`}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: done ── */}
        {step === 'done' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0 4px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-tint)', display: 'grid', placeItems: 'center' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--display)', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                {result.imported.toLocaleString()} imported
              </div>
              {result.skipped > 0 && (
                <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 4 }}>
                  {result.skipped.toLocaleString()} row{result.skipped !== 1 ? 's' : ''} skipped (missing email)
                </div>
              )}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
