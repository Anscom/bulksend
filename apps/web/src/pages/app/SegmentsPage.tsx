import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { segmentsApi } from '../../lib/api/segments.js';
import type { Segment, CreateSegmentRequest } from '@bulksend/shared';

// ── filter builder types ────────────────────────────────────────────────────

type FieldId = 'status' | 'email' | 'firstName' | 'lastName' | 'createdAt';
type OperatorId = 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'in' | 'exists';

interface FieldDef {
  id: FieldId;
  label: string;
  operators: OperatorId[];
  valueType: 'text' | 'status-select' | 'status-multi' | 'boolean' | 'date';
}

const FIELDS: FieldDef[] = [
  { id: 'status',    label: 'Status',     operators: ['eq', 'neq', 'in'],                  valueType: 'status-select' },
  { id: 'email',     label: 'Email',      operators: ['eq', 'neq', 'contains', 'exists'],   valueType: 'text' },
  { id: 'firstName', label: 'First name', operators: ['eq', 'neq', 'contains', 'exists'],   valueType: 'text' },
  { id: 'lastName',  label: 'Last name',  operators: ['eq', 'neq', 'contains', 'exists'],   valueType: 'text' },
  { id: 'createdAt', label: 'Created at', operators: ['gt', 'lt', 'eq'],                    valueType: 'date' },
];

const OPERATOR_LABELS: Record<OperatorId, string> = {
  eq:       'is',
  neq:      'is not',
  contains: 'contains',
  gt:       'after',
  lt:       'before',
  in:       'is any of',
  exists:   'exists',
};

const STATUS_OPTS = ['subscribed', 'unsubscribed', 'bounced'] as const;

interface FilterRow {
  id: number;
  field: FieldId;
  operator: OperatorId;
  value: string;
}

function makeRow(id: number): FilterRow {
  return { id, field: 'status', operator: 'eq', value: 'subscribed' };
}

// ── helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function describeFilter(f: { field: string; operator: string; value: unknown }): string {
  const field = FIELDS.find(x => x.id === f.field)?.label ?? f.field;
  const op    = OPERATOR_LABELS[f.operator as OperatorId] ?? f.operator ?? '=';
  if (f.operator === 'exists') return `${field} ${op}`;
  if (Array.isArray(f.value)) return `${field} ${op} [${(f.value as string[]).join(', ')}]`;
  return `${field} ${op} ${f.value}`;
}

function serializeFilterValue(row: FilterRow): unknown {
  if (row.operator === 'exists') return true;
  if (row.operator === 'in') return row.value.split(',').map(s => s.trim()).filter(Boolean);
  if (row.field === 'createdAt') return row.value;
  return row.value;
}

// ── sub-components ───────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  display: 'block', width: '100%', padding: '7px 10px',
  borderRadius: 7, border: '1px solid var(--border)',
  fontSize: 13, background: 'var(--bg)', color: 'var(--text)',
  boxSizing: 'border-box',
};

function FilterRowEditor({
  row,
  onChange,
  onRemove,
}: {
  row: FilterRow;
  onChange: (r: FilterRow) => void;
  onRemove: () => void;
}) {
  const fieldDef = FIELDS.find(f => f.id === row.field)!;

  function setField(field: FieldId) {
    const def = FIELDS.find(f => f.id === field)!;
    const op  = def.operators[0];
    const val = field === 'status' ? 'subscribed' : '';
    onChange({ ...row, field, operator: op, value: val });
  }

  function setOperator(operator: OperatorId) {
    const val = operator === 'exists' ? 'true' : row.value;
    onChange({ ...row, operator, value: val });
  }

  function renderValueInput() {
    if (row.operator === 'exists') {
      return (
        <select style={INPUT_STYLE} value={row.value} onChange={e => onChange({ ...row, value: e.target.value })}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }
    if (row.operator === 'in') {
      return (
        <input
          style={INPUT_STYLE}
          type="text"
          placeholder="val1, val2, …"
          value={row.value}
          onChange={e => onChange({ ...row, value: e.target.value })}
        />
      );
    }
    if (fieldDef.valueType === 'status-select') {
      return (
        <select style={INPUT_STYLE} value={row.value} onChange={e => onChange({ ...row, value: e.target.value })}>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      );
    }
    if (fieldDef.valueType === 'date') {
      return (
        <input
          style={INPUT_STYLE}
          type="date"
          value={row.value}
          onChange={e => onChange({ ...row, value: e.target.value })}
        />
      );
    }
    return (
      <input
        style={INPUT_STYLE}
        type="text"
        placeholder="value"
        value={row.value}
        onChange={e => onChange({ ...row, value: e.target.value })}
      />
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
      <select style={INPUT_STYLE} value={row.field} onChange={e => setField(e.target.value as FieldId)}>
        {FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
      </select>

      <select style={INPUT_STYLE} value={row.operator} onChange={e => setOperator(e.target.value as OperatorId)}>
        {fieldDef.operators.map(op => (
          <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
        ))}
      </select>

      {renderValueInput()}

      <button
        onClick={onRemove}
        style={{ width: 30, height: 30, border: '1px solid var(--border)', borderRadius: 7, background: 'var(--bg)', color: 'var(--slate)', cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center' }}
      >
        ×
      </button>
    </div>
  );
}

// ── main page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export function SegmentsPage() {
  const navigate       = useNavigate();
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();

  const [segments, setSegments]     = useState<Segment[]>([]);
  const [total,    setTotal]        = useState(0);
  const [page,     setPage]         = useState(1);
  const [loading,  setLoading]      = useState(true);
  const [error,    setError]        = useState('');
  const [search,   setSearch]       = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [formName, setFormName]     = useState('');
  const [filterRows, setFilterRows] = useState<FilterRow[]>([makeRow(0)]);
  const [nextId,   setNextId]       = useState(1);
  const [saving,   setSaving]       = useState(false);
  const [formError, setFormError]   = useState('');
  const [deleting,  setDeleting]    = useState<string | null>(null);
  const [listKey,   setListKey]     = useState(0);
  function refreshList() { setListKey(k => k + 1); }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    segmentsApi.list(page, PAGE_SIZE)
      .then(({ items, total: t }) => {
        if (!cancelled) { setSegments(items); setTotal(t); }
      })
      .catch(() => { if (!cancelled) setError('Failed to load segments'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, listKey]);

  // client-side search within the loaded page (segments are few — no need to round-trip for search)
  const filtered = segments.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalContacts = segments.reduce((sum, s) => sum + s.contactCount, 0);
  const totalPages    = Math.ceil(total / PAGE_SIZE);

  function openModal() {
    setFormName('');
    setFilterRows([makeRow(0)]);
    setNextId(1);
    setFormError('');
    setShowModal(true);
  }

  function addRow() {
    setFilterRows(r => [...r, makeRow(nextId)]);
    setNextId(n => n + 1);
  }

  function updateRow(updated: FilterRow) {
    setFilterRows(r => r.map(x => x.id === updated.id ? updated : x));
  }

  function removeRow(id: number) {
    setFilterRows(r => r.filter(x => x.id !== id));
  }

  async function handleCreate() {
    if (!formName.trim()) { setFormError('Segment name is required.'); return; }
    if (filterRows.length === 0) { setFormError('Add at least one filter.'); return; }

    const payload: CreateSegmentRequest = {
      name: formName.trim(),
      filters: filterRows.map(r => ({
        field: r.field,
        operator: r.operator,
        value: serializeFilterValue(r),
      })),
    };

    setSaving(true);
    setFormError('');
    try {
      await segmentsApi.create(payload);
      setShowModal(false);
      setPage(1);
      refreshList();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to create segment');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await segmentsApi.delete(id);
      setSegments(prev => prev.filter(s => s.id !== id));
      setTotal(t => t - 1);
    } catch {
      // silently ignore — keep row in list
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="view active">
      <Topbar crumb="Acme Marketing" title="Segments" onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>

        {/* KPI strip */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { label: 'Total segments',        value: total.toLocaleString() },
            { label: 'Contacts covered',       value: totalContacts.toLocaleString() },
            { label: 'Avg contacts / segment', value: segments.length ? Math.round(totalContacts / segments.length).toLocaleString() : '—' },
          ].map(s => (
            <div key={s.label} className="kpi">
              <div className="kl" style={{ color: 'var(--slate)' }}>{s.label}</div>
              <div className="kv num">{s.value}</div>
            </div>
          ))}
        </div>

        {/* toolbar */}
        <div className="view-head">
          <div className="vh-l" />
          <div className="vh-actions">
            <div className="tb-search" style={{ width: 220, maxWidth: '100%' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search segments…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={openModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M12 5v14M5 12h14"/></svg>
              New Segment
            </button>
          </div>
        </div>

        {/* table */}
        <div className="table-card">
          {error && (
            <div style={{ padding: 24, color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 13 }}>{error}</div>
          )}
          {loading && !error && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--slate)' }}>Loading…</div>
          )}
          {!loading && !error && (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Filters</th>
                  <th>Contacts</th>
                  <th className="hide-sm">Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--slate)' }}>
                      {search ? 'No segments match your search' : 'No segments yet — create one to get started'}
                    </td>
                  </tr>
                )}
                {filtered.map(seg => {
                  const filters = Array.isArray(seg.filters)
                    ? seg.filters
                    : (JSON.parse(seg.filters as unknown as string) as typeof seg.filters);

                  return (
                    <tr key={seg.id} onClick={() => navigate(`/segments/${seg.id}`)}>
                      <td>
                        <div className="t-name">{seg.name}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {filters.length === 0 ? (
                            <span style={{ color: 'var(--slate)', fontSize: 12 }}>All contacts</span>
                          ) : filters.map((f, i) => (
                            <span key={i} className="tag" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                              {describeFilter(f)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="t-mono">{seg.contactCount.toLocaleString()}</span>
                      </td>
                      <td className="hide-sm t-mute">
                        {formatDate(seg.createdAt)}
                      </td>
                      <td className="t-actions">
                        <button
                          className="t-more"
                          disabled={deleting === seg.id}
                          onClick={e => { e.stopPropagation(); handleDelete(seg.id); }}
                          title="Delete segment"
                        >
                          {deleting === seg.id
                            ? <span style={{ fontSize: 10 }}>…</span>
                            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          }
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--slate)' }}>
              {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(page * PAGE_SIZE, total).toLocaleString()} of {total.toLocaleString()}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                return (
                  <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`} style={{ minWidth: 36 }} onClick={() => setPage(p)}>{p}</button>
                );
              })}
              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}

      </div>

      {/* create modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, width: 560, maxWidth: '94vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>New Segment</h3>
              <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* name */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
                Segment name
                <input
                  style={INPUT_STYLE}
                  type="text"
                  placeholder="e.g. Active subscribers"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </label>

              {/* filters */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Filters</span>
                  <span style={{ fontSize: 11, color: 'var(--slate)', fontFamily: 'var(--mono)' }}>ALL conditions must match</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filterRows.map(row => (
                    <FilterRowEditor
                      key={row.id}
                      row={row}
                      onChange={updateRow}
                      onRemove={() => removeRow(row.id)}
                    />
                  ))}
                </div>
                <button
                  className="btn btn-subtle btn-sm"
                  style={{ marginTop: 10 }}
                  onClick={addRow}
                >
                  + Add filter
                </button>
              </div>

              {formError && (
                <p style={{ margin: 0, color: 'var(--red)', fontSize: 13 }}>{formError}</p>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>
                  {saving ? 'Creating…' : 'Create Segment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
