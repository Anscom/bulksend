import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { contactsApi } from '../../lib/api/contacts.js';
import { ImportModal } from '../../components/contacts/ImportModal.js';
import { useWorkspaceStore } from '../../stores/workspace.store.js';
import type { Contact, ContactStatus } from '@bulksend/shared';

const PAGE_SIZE = 50;

type TabKey = 'all' | ContactStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',          label: 'All' },
  { key: 'subscribed',   label: 'Subscribed' },
  { key: 'unsubscribed', label: 'Unsubscribed' },
  { key: 'bounced',      label: 'Bounced' },
];

const AVATAR_COLORS = ['var(--indigo)', 'var(--coral)', 'var(--green)', 'var(--amber)', 'var(--blue)'];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!;
}
function initials(c: Contact): string {
  const f = c.firstName?.[0] ?? '';
  const l = c.lastName?.[0]  ?? '';
  return (f + l).toUpperCase() || c.email[0]!.toUpperCase();
}
function displayName(c: Contact): string {
  const full = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
  return full || c.email;
}

const INPUT_STYLE: React.CSSProperties = {
  display: 'block', width: '100%', padding: '8px 12px',
  borderRadius: 8, border: '1px solid var(--border)',
  fontSize: 14, background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box',
};

export function ContactsPage() {
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();
  const workspace = useWorkspaceStore(s => s.workspace);

  // table state
  const [contacts,    setContacts]    = useState<Contact[]>([]);
  const [total,       setTotal]       = useState(0);
  const [cursor,      setCursor]      = useState<string | null>(null);
  const [nextCursor,  setNextCursor]  = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // filter state
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search,    setSearch]    = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // per-status counts for KPI/tabs (fetched once on mount, refreshed after mutations)
  const [counts, setCounts] = useState({ all: 0, subscribed: 0, unsubscribed: 0, bounced: 0 });

  // selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // inline status editing
  async function handleStatusChange(id: string, status: ContactStatus) {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    try {
      await contactsApi.update(id, { status } as never);
      refreshCounts();
    } catch {
      refreshList();
    }
  }

  // confirm-delete dialog
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);

  // import modal
  const [showImport, setShowImport] = useState(false);

  // create modal
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState({ firstName: '', lastName: '', email: '', status: 'subscribed' as ContactStatus });
  const [formError, setFormError] = useState('');
  const [saving,    setSaving]    = useState(false);

  function resetCursor() {
    setCursor(null);
    setNextCursor(null);
    setCursorStack([]);
  }

  // debounce search — reset cursor when search changes
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      resetCursor();
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // reset cursor when tab changes
  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    resetCursor();
  }

  // bump this to force a re-fetch without changing cursor/tab/search
  const [listKey, setListKey] = useState(0);
  function refreshList() { resetCursor(); setListKey(k => k + 1); }

  // fetch contacts whenever cursor/tab/search changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const status = activeTab === 'all' ? undefined : activeTab;
    contactsApi.list(PAGE_SIZE, status, debouncedSearch || undefined, cursor ?? undefined)
      .then(({ items, total: t, nextCursor: nc }: { items: Contact[]; total: number; nextCursor: string | null }) => {
        if (!cancelled) { setContacts(items); setTotal(t); setNextCursor(nc); setSelected(new Set()); }
      })
      .catch(() => { if (!cancelled) setError('Failed to load contacts'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cursor, activeTab, debouncedSearch, listKey]);

  // fetch counts for KPI cards (re-runs after mutations)
  const [countKey, setCountKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      contactsApi.list(1),
      contactsApi.list(1, 'subscribed'),
      contactsApi.list(1, 'unsubscribed'),
      contactsApi.list(1, 'bounced'),
    ]).then(([all, sub, unsub, bounced]: Array<{ total: number }>) => {
      if (!cancelled) setCounts({
        all:          all.total,
        subscribed:   sub.total,
        unsubscribed: unsub.total,
        bounced:      bounced.total,
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [countKey]);

  function refreshCounts() { setCountKey(k => k + 1); }

  async function handleCreate() {
    if (!form.email.trim()) { setFormError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setFormError('Enter a valid email address.'); return; }
    setSaving(true);
    setFormError('');
    try {
      await contactsApi.create({
        email:     form.email.trim().toLowerCase(),
        firstName: form.firstName.trim() || undefined,
        lastName:  form.lastName.trim()  || undefined,
      });
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', status: 'subscribed' });
      refreshList();
      refreshCounts();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to create contact');
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(ids: string[]) {
    setConfirmIds(ids);
  }

  async function confirmDelete() {
    if (!confirmIds) return;
    const ids = confirmIds;
    setConfirmIds(null);
    try {
      await Promise.all(ids.map(id => contactsApi.delete(id)));
      setContacts(prev => prev.filter(c => !ids.includes(c.id)));
      setTotal(t => t - ids.length);
      setSelected(prev => { const s = new Set(prev); ids.forEach(id => s.delete(id)); return s; });
      refreshCounts();
    } catch { /* keep rows */ }
  }

  const tabCount = (k: TabKey) => counts[k];
  const hasPrev = cursorStack.length > 0;
  const hasNext = nextCursor !== null;

  return (
    <div className="view active">
      <Topbar crumb={workspace?.name ?? 'Contacts'} title="Contacts" onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>

        {/* KPI strip */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'Total contacts',  value: counts.all,          color: '' },
            { label: 'Subscribed',      value: counts.subscribed,   color: 'var(--green)' },
            { label: 'Unsubscribed',    value: counts.unsubscribed, color: 'var(--amber)' },
            { label: 'Bounced',         value: counts.bounced,      color: 'var(--red)' },
          ].map(s => (
            <div key={s.label} className="kpi">
              <div className="kl" style={{ color: 'var(--slate)' }}>{s.label}</div>
              <div className="kv num" style={s.color ? { color: s.color } : {}}>{s.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* toolbar */}
        <div className="view-head">
          <div className="vh-l">
            <div className="tabs">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`tab${activeTab === key ? ' active' : ''}`}
                  onClick={() => switchTab(key)}
                >
                  {label} <span className="cnt">{tabCount(key).toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="vh-actions">
            {selected.size > 0 && (
              <button
                className="btn btn-sm"
                style={{ background: 'var(--red)', color: '#fff', border: 'none' }}
                onClick={() => requestDelete([...selected])}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                Delete {selected.size} selected
              </button>
            )}
            <div className="tb-search" style={{ width: 220, maxWidth: '100%' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search contacts…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <a
              className="btn btn-ghost btn-sm"
              href={contactsApi.export(activeTab === 'all' ? undefined : activeTab)}
              download="contacts.csv"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Export
            </a>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowImport(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => { setFormError(''); setShowModal(true); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M12 5v14M5 12h14"/></svg>
              Add Contact
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
                  <th style={{ width: 40, paddingRight: 0 }}>
                    <input
                      type="checkbox"
                      checked={contacts.length > 0 && contacts.every(c => selected.has(c.id))}
                      ref={el => { if (el) el.indeterminate = selected.size > 0 && !contacts.every(c => selected.has(c.id)); }}
                      onChange={e => {
                        if (e.target.checked) setSelected(new Set(contacts.map(c => c.id)));
                        else setSelected(new Set());
                      }}
                    />
                  </th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th className="hide-sm">First name</th>
                  <th className="hide-sm">Last name</th>
                  <th className="hide-sm">Added</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--slate)' }}>
                      {debouncedSearch ? 'No contacts match your search' : 'No contacts yet'}
                    </td>
                  </tr>
                )}
                {contacts.map(c => (
                  <tr key={c.id} style={{ cursor: 'default', background: selected.has(c.id) ? 'var(--hover)' : undefined }}>
                    <td style={{ paddingRight: 0 }}>
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={e => {
                          setSelected(prev => {
                            const s = new Set(prev);
                            e.target.checked ? s.add(c.id) : s.delete(c.id);
                            return s;
                          });
                        }}
                      />
                    </td>
                    <td>
                      <div className="cell-contact">
                        <span className="avatar" style={{ width: 34, height: 34, background: avatarColor(c.id) }}>
                          {initials(c)}
                        </span>
                        <div>
                          <div className="t-name">{displayName(c)}</div>
                          <div className="t-sub">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={c.status}
                        onChange={e => handleStatusChange(c.id, e.target.value as ContactStatus)}
                        style={{
                          appearance: 'none', WebkitAppearance: 'none',
                          border: 'none', background: 'transparent',
                          cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          padding: '3px 20px 3px 8px',
                          borderRadius: 20,
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 6px center',
                          color: c.status === 'subscribed' ? 'var(--green)' : c.status === 'unsubscribed' ? 'var(--amber)' : 'var(--red)',
                          backgroundColor: c.status === 'subscribed' ? 'rgba(34,197,94,0.12)' : c.status === 'unsubscribed' ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.12)',
                        }}
                      >
                        <option value="subscribed">Subscribed</option>
                        <option value="unsubscribed">Unsubscribed</option>
                        <option value="bounced">Bounced</option>
                      </select>
                    </td>
                    <td className="hide-sm t-mute">{c.firstName ?? '—'}</td>
                    <td className="hide-sm t-mute">{c.lastName  ?? '—'}</td>
                    <td className="hide-sm t-mute">
                      {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="t-actions">
                      <button
                        className="t-more"
                        title="Delete contact"
                        onClick={() => requestDelete([c.id])}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* pagination */}
        {!loading && (hasPrev || hasNext) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--slate)' }}>
              {contacts.length.toLocaleString()} of {total.toLocaleString()} contacts
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                disabled={!hasPrev}
                onClick={() => {
                  const prev = cursorStack.at(-1) ?? null;
                  setCursorStack(s => s.slice(0, -1));
                  setCursor(prev);
                }}
              >← Prev</button>
              <button
                className="btn btn-ghost btn-sm"
                disabled={!hasNext}
                onClick={() => {
                  setCursorStack(s => [...s, cursor ?? '']);
                  setCursor(nextCursor);
                }}
              >Next →</button>
            </div>
          </div>
        )}

      </div>

      {/* confirm delete dialog */}
      {confirmIds !== null && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setConfirmIds(null)}
        >
          <div
            style={{ background: 'var(--surface)', borderRadius: 12, padding: 28, width: 380, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
              </span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                Delete {confirmIds.length === 1 ? 'contact' : `${confirmIds.length} contacts`}?
              </h3>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--slate)', lineHeight: 1.5 }}>
              {confirmIds.length === 1
                ? 'This contact will be permanently removed. This action cannot be undone.'
                : `${confirmIds.length} contacts will be permanently removed. This action cannot be undone.`}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmIds(null)}>Cancel</button>
              <button
                className="btn btn-sm"
                style={{ background: 'var(--red)', color: '#fff', border: 'none' }}
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* import modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => { refreshCounts(); refreshList(); }}
        />
      )}

      {/* create modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: 'var(--surface)', borderRadius: 12, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Add Contact</h3>
              <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
                  First name
                  <input style={INPUT_STYLE} type="text" placeholder="Jane" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
                  Last name
                  <input style={INPUT_STYLE} type="text" placeholder="Smith" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                </label>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
                Email <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>
                <input style={INPUT_STYLE} type="email" placeholder="jane@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </label>
              {formError && <p style={{ margin: 0, color: 'var(--red)', fontSize: 13 }}>{formError}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>
                  {saving ? 'Adding…' : 'Add Contact'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
