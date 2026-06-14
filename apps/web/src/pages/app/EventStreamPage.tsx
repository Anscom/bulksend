import { useEffect, useState, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { analyticsApi, type EventRow } from '../../lib/api/analytics.js';
import type { EventType } from '@bulksend/shared';

const EVENT_TYPES: Array<{ key: EventType | ''; label: string }> = [
  { key: '',             label: 'All events' },
  { key: 'delivered',   label: 'Delivered' },
  { key: 'opened',      label: 'Opened' },
  { key: 'clicked',     label: 'Clicked' },
  { key: 'bounced',     label: 'Bounced' },
  { key: 'unsubscribed',label: 'Unsubscribed' },
  { key: 'spam',        label: 'Spam' },
];

type EventColor = { bg: string; fg: string };

const EVENT_COLORS: Record<string, EventColor> = {
  delivered:    { bg: 'var(--blue-tint)',  fg: 'var(--blue)'  },
  opened:       { bg: 'var(--green-tint)', fg: 'var(--green)' },
  clicked:      { bg: 'var(--coral-tint)', fg: 'var(--coral)' },
  bounced:      { bg: 'var(--red-tint)',   fg: 'var(--red)'   },
  unsubscribed: { bg: 'var(--bg-2)',       fg: 'var(--slate)' },
  spam:         { bg: 'var(--amber-tint)', fg: 'var(--amber)' },
};

function EventIcon({ type }: { type: string }) {
  const { bg, fg } = EVENT_COLORS[type] ?? { bg: 'var(--bg-2)', fg: 'var(--slate)' };
  const icons: Record<string, JSX.Element> = {
    delivered:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>,
    opened:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>,
    clicked:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    bounced:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>,
    unsubscribed: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="17"/><line x1="23" y1="11" x2="17" y2="17"/></svg>,
    spam:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  };
  return (
    <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, color: fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      {icons[type] ?? icons['delivered']}
    </div>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s  = Math.floor(ms / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function contactLabel(row: EventRow): string {
  const name = [row.contactFirstName, row.contactLastName].filter(Boolean).join(' ');
  return name || row.contactEmail;
}

const PAGE_SIZE = 50;

export function EventStreamPage() {
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<EventType | ''>('');
  const [page, setPage]     = useState(1);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback((p: number, f: EventType | '') => {
    setLoading(true);
    analyticsApi.getEvents(p, PAGE_SIZE, f)
      .then(result => {
        setEvents(result.items);
        setTotal(result.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(1, ''); }, [load]);

  function applyFilter(f: EventType | '') {
    setFilter(f);
    setPage(1);
    load(1, f);
  }

  function goPage(p: number) {
    setPage(p);
    load(p, filter);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="view active">
      <Topbar crumb="Analytics" title="Event Stream" onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>

        {/* header row */}
        <div className="view-head">
          <div className="vh-l">
            <h2>Event Stream</h2>
            <div className="vh-sub">Live feed of every email event · {total.toLocaleString()} total</div>
          </div>
          <div className="vh-actions">
            <div className="tabs">
              {EVENT_TYPES.map(({ key, label }) => (
                <button
                  key={key}
                  className={`tab${filter === key ? ' active' : ''}`}
                  onClick={() => applyFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* event table */}
        <div className="table-card">
          {loading
            ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--slate)' }}>Loading…</div>
            )
            : events.length === 0
              ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--slate)' }}>
                  No events found
                  {filter && <span> for <strong>{filter}</strong></span>}
                </div>
              )
              : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Contact</th>
                      <th className="hide-sm">Campaign</th>
                      <th style={{ textAlign: 'right' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(ev => (
                      <tr key={ev.id} onClick={() => navigate(`/campaigns/${ev.campaignId}`)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <EventIcon type={ev.type} />
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', textTransform: 'capitalize' }}>
                              {ev.type}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="t-name">{contactLabel(ev)}</div>
                          <div className="t-sub">{ev.contactEmail}</div>
                        </td>
                        <td className="hide-sm t-mute">{ev.campaignName}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="t-mono" style={{ fontSize: 12 }}>{timeAgo(ev.occurredAt)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
          }

          {/* pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--line-2)' }}>
              <span style={{ fontSize: 13, color: 'var(--slate)' }}>
                Page {page} of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={page <= 1}
                  onClick={() => goPage(page - 1)}
                  style={{ opacity: page <= 1 ? 0.4 : 1 }}
                >
                  ← Previous
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => goPage(page + 1)}
                  style={{ opacity: page >= totalPages ? 0.4 : 1 }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
