import { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { Badge } from '../../components/ui/Badge.js';
import { segmentsApi } from '../../lib/api/segments.js';
import type { Segment, Contact, ContactStatus } from '@bulksend/shared';
import { formatDate as _formatDate } from '../../lib/utils/format.js';

const PAGE_SIZE = 50;

type FieldId = 'status' | 'email' | 'firstName' | 'lastName' | 'createdAt';
type OperatorId = 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'in' | 'exists';

const FIELD_LABELS: Record<FieldId, string> = {
  status: 'Status', email: 'Email', firstName: 'First name', lastName: 'Last name', createdAt: 'Created at',
};
const OPERATOR_LABELS: Record<OperatorId, string> = {
  eq: 'is', neq: 'is not', contains: 'contains', gt: 'after', lt: 'before', in: 'is any of', exists: 'exists',
};

function describeFilter(f: { field: string; operator: string; value: unknown }): string {
  const field = FIELD_LABELS[f.field as FieldId] ?? f.field;
  const op    = OPERATOR_LABELS[f.operator as OperatorId] ?? f.operator ?? '=';
  if (f.operator === 'exists') return `${field} ${op}`;
  if (Array.isArray(f.value)) return `${field} ${op} ${(f.value as string[]).join(', ')}`;
  return `${field} ${op} ${f.value}`;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return _formatDate(new Date(d as string));
}

function initials(c: Contact): string {
  const f = c.firstName?.[0] ?? '';
  const l = c.lastName?.[0]  ?? '';
  return (f + l).toUpperCase() || c.email[0]!.toUpperCase();
}

const AVATAR_COLORS = ['var(--indigo)', 'var(--coral)', 'var(--green)', 'var(--amber)', 'var(--blue)'];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!;
}

export function SegmentDetailPage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();

  const [segment,  setSegment]  = useState<Segment | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [loadingC, setLoadingC] = useState(false);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');

  // load segment meta
  useEffect(() => {
    if (!id) return;
    segmentsApi.get(id)
      .then(s => setSegment(s))
      .catch(() => setError('Segment not found'));
  }, [id]);

  // load contacts page
  useEffect(() => {
    if (!id) return;
    setLoadingC(true);
    segmentsApi.contacts(id, page, PAGE_SIZE)
      .then(({ contacts: c, total: t }) => { setContacts(c); setTotal(t); })
      .catch(() => setError('Failed to load contacts'))
      .finally(() => { setLoading(false); setLoadingC(false); });
  }, [id, page]);

  const filters = segment
    ? (Array.isArray(segment.filters)
        ? segment.filters
        : JSON.parse(segment.filters as unknown as string) as typeof segment.filters)
    : [];

  const filtered = contacts.filter(c =>
    !search ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    `${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="view active">
      <Topbar crumb="Segments" title={segment?.name ?? '…'} onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>

        {/* back */}
        <button className="back-link" onClick={() => navigate('/segments')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          All Segments
        </button>

        {error && (
          <div style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 13, marginTop: 16 }}>{error}</div>
        )}

        {segment && (
          <>
            {/* segment header card */}
            <div className="detail-head" style={{ marginTop: 16 }}>
              <div className="detail-top">
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>
                  {segment.name}
                </h2>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--slate)' }}>
                  {total.toLocaleString()} contact{total !== 1 ? 's' : ''}
                </div>
              </div>

              {/* filter chips */}
              {filters.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: 'var(--slate)', fontFamily: 'var(--mono)', alignSelf: 'center', marginRight: 4 }}>WHERE</span>
                  {filters.map((f, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span className="tag" style={{ fontFamily: 'var(--mono)', fontSize: 11.5 }}>
                        {describeFilter(f)}
                      </span>
                      {i < filters.length - 1 && (
                        <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--slate-3)', fontWeight: 600 }}>AND</span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              <div className="detail-meta" style={{ marginTop: 14 }}>
                <span className="dm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  Created <b>{formatDate(segment.createdAt)}</b>
                </span>
                <span className="dm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>
                  <b>{filters.length}</b> filter{filters.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* contacts table */}
            <div className="view-head" style={{ marginTop: 8 }}>
              <div className="vh-l" />
              <div className="vh-actions">
                <div className="tb-search" style={{ width: 240, maxWidth: '100%' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input
                    type="text"
                    placeholder="Search contacts…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); }}
                  />
                </div>
              </div>
            </div>

            <div className="table-card">
              {(loading || loadingC) && (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--slate)' }}>Loading…</div>
              )}
              {!loading && !loadingC && (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Contact</th>
                      <th>Status</th>
                      <th className="hide-sm">First name</th>
                      <th className="hide-sm">Last name</th>
                      <th className="hide-sm">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--slate)' }}>
                          {search ? 'No contacts match your search' : 'No contacts in this segment'}
                        </td>
                      </tr>
                    )}
                    {filtered.map(c => (
                      <tr key={c.id} style={{ cursor: 'default' }}>
                        <td>
                          <div className="cell-contact">
                            <span className="avatar" style={{ width: 34, height: 34, background: avatarColor(c.id) }}>
                              {initials(c)}
                            </span>
                            <div>
                              <div className="t-name">
                                {c.firstName || c.lastName
                                  ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim()
                                  : c.email}
                              </div>
                              <div className="t-sub">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge variant={c.status as ContactStatus}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="hide-sm t-mute">{c.firstName ?? '—'}</td>
                        <td className="hide-sm t-mute">{c.lastName  ?? '—'}</td>
                        <td className="hide-sm t-mute">{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--slate)' }}>
                  Page {page} of {totalPages} · {total.toLocaleString()} contacts
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    ← Prev
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
