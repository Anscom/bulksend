import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { Badge } from '../../components/ui/Badge.js';
import { campaignsApi, type CampaignSendRow } from '../../lib/api/campaigns.js';
import { contactsApi } from '../../lib/api/contacts.js';
import { segmentsApi } from '../../lib/api/segments.js';
import type { Campaign, CampaignStats, ContactStatus, CreateContactRequest, Segment } from '@bulksend/shared';

// ── Helpers ──────────────────────────────────────────────────────────────────

type DisplaySendStatus = 'sent' | 'failed' | 'bounced' | 'pending' | 'suppressed';

function mapSendStatus(status: string): DisplaySendStatus {
  if (status === 'sent')         return 'sent';
  if (status === 'bounced')      return 'bounced';
  if (status === 'failed')       return 'failed';
  if (status === 'unsubscribed') return 'suppressed';
  return 'pending';
}

const STATUS_LABEL: Record<DisplaySendStatus, string> = {
  sent: 'Sent', bounced: 'Bounced', failed: 'Failed', pending: 'Pending', suppressed: 'Suppressed',
};
const STATUS_COLOR: Record<DisplaySendStatus, string> = {
  sent: 'var(--green)', bounced: 'var(--red)', failed: 'var(--red)', pending: 'var(--slate)', suppressed: 'var(--amber)',
};

function initials(firstName: string | null, lastName: string | null, email: string): string {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function avatarColor(seed: string): string {
  const palette = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#0ea5e9', '#a855f7'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(h) % palette.length];
}

function contactName(row: CampaignSendRow): string {
  if (row.contactFirstName && row.contactLastName) return `${row.contactFirstName} ${row.contactLastName}`;
  if (row.contactFirstName) return row.contactFirstName;
  return row.contactEmail;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const dt = new Date(d as string);
  if (isNaN(dt.getTime())) return '—';
  if (dt.toDateString() === new Date().toDateString()) return 'Today';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(d: Date | string | null | undefined): string {
  if (!d) return '';
  const dt = new Date(d as string);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: 'var(--slate-3)', letterSpacing: '0.04em', textTransform: 'uppercase',
};
const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', fontSize: 14, background: 'var(--bg)',
  color: 'var(--text)', boxSizing: 'border-box', outline: 'none',
};

// ── Edit Campaign Modal ───────────────────────────────────────────────────────

function EditModal({
  campaign,
  onClose,
  onSaved,
}: { campaign: Campaign; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(campaign.name);
  const [subject, setSubject] = useState(campaign.subject);
  const [fromName, setFromName] = useState(campaign.fromName);
  const [fromEmail, setFromEmail] = useState(campaign.fromEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    if (!name.trim() || !subject.trim() || !fromName.trim() || !fromEmail.trim()) {
      setError('All fields are required.');
      return;
    }
    if (!fromEmail.includes('@') || fromEmail.toLowerCase().endsWith('@acme.co')) {
      setError('Please enter a valid from email address using your own domain.');
      return;
    }
    setSaving(true);
    try {
      await campaignsApi.update(campaign.id, {
        name: name.trim(), subject: subject.trim(),
        fromName: fromName.trim(), fromEmail: fromEmail.trim(),
      });
      onSaved();
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 28, width: 460, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Edit campaign</h3>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Campaign name</span>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Campaign name" />
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Subject line</span>
            <input style={inputStyle} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...fieldStyle, flex: 1 }}>
              <span style={labelStyle}>From name</span>
              <input style={inputStyle} value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Your Name" />
            </div>
            <div style={{ ...fieldStyle, flex: 1 }}>
              <span style={labelStyle}>From email</span>
              <input style={inputStyle} type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="hello@yourdomain.com" />
            </div>
          </div>
          {error && <p style={{ margin: 0, color: 'var(--red)', fontSize: 13 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Recipient Modal ───────────────────────────────────────────────────────

function AddRecipientModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function add() {
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return; }
    setSaving(true);
    try {
      const payload: CreateContactRequest = { email: email.trim().toLowerCase() };
      if (firstName.trim()) payload.firstName = firstName.trim();
      if (lastName.trim())  payload.lastName  = lastName.trim();
      await contactsApi.create(payload);
      onAdded();
      onClose();
    } catch {
      setError('Failed to add contact. They may already exist.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface)', borderRadius: 14, padding: '28px 28px 24px', width: 420, maxWidth: '92vw', boxShadow: '0 12px 48px rgba(0,0,0,0.22)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>Add contact</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate)' }}>New contacts are added to your audience.</p>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', marginTop: -2 }} onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...fieldStyle, flex: 1 }}>
              <span style={labelStyle}>First name</span>
              <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" autoFocus />
            </div>
            <div style={{ ...fieldStyle, flex: 1 }}>
              <span style={labelStyle}>Last name</span>
              <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" />
            </div>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Email address</span>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
        </div>
        {error && (
          <p style={{ margin: '12px 0 0', padding: '8px 12px', borderRadius: 6, background: 'rgba(220,38,38,0.08)', color: 'var(--red)', fontSize: 13 }}>
            {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={add} disabled={saving}>
            {saving ? 'Adding…' : 'Add contact'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Resend Modal ──────────────────────────────────────────────────────────────

function ResendModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState(`${campaign.name} (resend)`);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(true);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(campaign.segmentId ?? '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    segmentsApi.list(1, 100)
      .then(r => setSegments(r.items))
      .catch(() => {})
      .finally(() => setLoadingSegments(false));
  }, []);

  async function handleSendNow() {
    setSending(true);
    setError('');
    try {
      const copy = await campaignsApi.create({
        name: name.trim() || `${campaign.name} (resend)`,
        subject: campaign.subject,
        fromName: campaign.fromName,
        fromEmail: campaign.fromEmail,
        bodyHtml: campaign.bodyHtml,
        bodyText: campaign.bodyText,
        ...(campaign.previewText ? { previewText: campaign.previewText } : {}),
        ...(selectedSegmentId ? { segmentId: selectedSegmentId } : {}),
      });
      await campaignsApi.send(copy.id);
      onClose();
      navigate(`/campaigns/${copy.id}`);
    } catch {
      setError('Failed to send. Please try again.');
      setSending(false);
    }
  }

  function handleEditFirst() {
    onClose();
    navigate('/campaigns/new', {
      state: { resendFrom: campaign, segmentId: selectedSegmentId || null },
    });
  }

  const selectedSegment = segments.find(s => s.id === selectedSegmentId);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface)', borderRadius: 12, padding: '28px 28px 24px', width: 440, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Send again</h3>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Campaign name</span>
            <input
              style={inputStyle}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Send to segment</span>
            {loadingSegments ? (
              <div style={{ ...inputStyle, color: 'var(--slate)' }}>Loading segments…</div>
            ) : (
              <select
                style={{ ...inputStyle, WebkitAppearance: 'none', cursor: 'pointer' }}
                value={selectedSegmentId}
                onChange={e => setSelectedSegmentId(e.target.value)}
              >
                <option value="">All contacts</option>
                {segments.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.contactCount.toLocaleString()})</option>
                ))}
              </select>
            )}
            {selectedSegment && (
              <span style={{ fontSize: 12, color: 'var(--slate)' }}>
                {selectedSegment.contactCount.toLocaleString()} contact{selectedSegment.contactCount !== 1 ? 's' : ''} in this segment
              </span>
            )}
          </div>
          {error && <p style={{ margin: 0, color: 'var(--red)', fontSize: 13 }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={sending}>Cancel</button>
          <button className="btn btn-ghost btn-sm" onClick={handleEditFirst} disabled={sending}>Edit first →</button>
          <button className="btn btn-primary btn-sm" onClick={handleSendNow} disabled={sending || loadingSegments}>
            {sending ? 'Sending…' : 'Send now'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteConfirmModal({
  count, step, onCancel, onFirstConfirm, onFinalConfirm,
}: { count: number; step: 1 | 2; onCancel: () => void; onFirstConfirm: () => void; onFinalConfirm: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
      onClick={onCancel}
    >
      <div
        style={{ background: 'var(--surface)', borderRadius: 14, padding: '28px 28px 24px', width: 400, maxWidth: '92vw', boxShadow: '0 12px 48px rgba(0,0,0,0.22)' }}
        onClick={e => e.stopPropagation()}
      >
        {step === 1 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Remove {count} contact{count !== 1 ? 's' : ''}?</h3>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--slate)', lineHeight: 1.5 }}>
              {count === 1 ? 'This will permanently delete the contact from your audience.' : `This will permanently delete ${count} contacts from your audience.`}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
              <button className="btn btn-sm" style={{ background: 'var(--red)', color: '#fff', border: 'none' }} onClick={onFirstConfirm}>Yes, continue</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--red)' }}>This cannot be undone</h3>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--slate)', lineHeight: 1.5 }}>
              {count === 1 ? 'The contact will be permanently deleted. Are you absolutely sure?' : `All ${count} contacts will be permanently deleted. Are you absolutely sure?`}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
              <button className="btn btn-sm" style={{ background: 'var(--red)', color: '#fff', border: 'none' }} onClick={onFinalConfirm}>Delete permanently</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CampaignDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [sends, setSends] = useState<CampaignSendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [acting, setActing] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [showResend, setShowResend] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [c, s, sr] = await Promise.all([
        campaignsApi.get(id),
        campaignsApi.getStats(id).catch(() => null),
        campaignsApi.getSends(id, 1, 200).catch(() => ({ items: [] as CampaignSendRow[], total: 0 })),
      ]);
      setCampaign(c);
      setStats(s);
      setSends(sr.items);
    } catch {
      setNotFound(true);
    }
  }, [id]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  if (loading) {
    return (
      <div className="view active">
        <Topbar crumb="Campaigns" title="Loading…" onMenuOpen={onMenuOpen} />
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--slate)' }}>Loading…</div>
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="view active">
        <Topbar crumb="Campaigns" title="Campaign not found" onMenuOpen={onMenuOpen} />
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--slate)' }}>
          <p>This campaign doesn't exist.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/campaigns')}>← Back</button>
        </div>
      </div>
    );
  }

  const isSent    = campaign.status === 'sent' || campaign.status === 'paused';
  const isSending = campaign.status === 'sending';
  const hasSends  = isSent || isSending || campaign.status === 'failed';
  const canEdit   = campaign.status === 'draft' || campaign.status === 'scheduled';

  const delivered      = stats?.delivered      ?? 0;
  const opened         = stats?.opened         ?? 0;
  const clicked        = stats?.clicked        ?? 0;
  const bounced        = stats?.bounced        ?? 0;
  const sentCount      = stats?.sent           ?? 0;
  const unsubscribed   = stats?.unsubscribed   ?? 0;
  const totalRecipients = campaign.totalRecipients;

  const suppressedCount = sends.filter(s => s.status === 'unsubscribed').length;

  const sentDate = campaign.sentAt ?? campaign.scheduledAt ?? campaign.createdAt;

  function pct(n: number, of: number) { return of === 0 ? '—' : `${Math.round((n / of) * 100)}%`; }

  const allChecked  = sends.length > 0 && sends.every(s => selectedIds.has(s.contactId));
  const someChecked = sends.some(s => selectedIds.has(s.contactId));

  function toggleAll() {
    if (allChecked) setSelectedIds(new Set());
    else setSelectedIds(new Set(sends.map(s => s.contactId)));
  }

  function toggleRow(contactId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  }

  async function handlePause() {
    setActing(true);
    try {
      const updated = await campaignsApi.pause(campaign!.id);
      setCampaign(updated);
    } finally { setActing(false); }
  }

  async function handleResume() {
    setActing(true);
    try {
      const updated = await campaignsApi.resume(campaign!.id);
      setCampaign(updated);
    } finally { setActing(false); }
  }

  async function handleDuplicate() {
    try {
      const copy = await campaignsApi.create({
        name: `Copy of ${campaign!.name}`,
        subject: campaign!.subject,
        fromName: campaign!.fromName,
        fromEmail: campaign!.fromEmail,
        bodyHtml: campaign!.bodyHtml,
        bodyText: campaign!.bodyText,
        ...(campaign!.previewText ? { previewText: campaign!.previewText } : {}),
        ...(campaign!.segmentId   ? { segmentId:   campaign!.segmentId }   : {}),
      });
      navigate(`/campaigns/${copy.id}`);
    } catch { /* ignore */ }
  }

  async function handleFinalConfirm() {
    setActing(true);
    try {
      await Promise.all([...selectedIds].map(cid => contactsApi.delete(cid).catch(() => {})));
      setSelectedIds(new Set());
      setDeleteStep(0);
      await fetchData();
    } finally { setActing(false); }
  }

  return (
    <div className="view active">
      <Topbar crumb="Campaigns" title={campaign.name} onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>

        <button className="back-link" onClick={() => navigate('/campaigns')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to campaigns
        </button>

        {/* Header */}
        <div className="detail-head">
          <div className="detail-top">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {campaign.name}
              <Badge variant={campaign.status} pulse={campaign.status === 'sending'}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {canEdit && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
              )}
              {campaign.status === 'sending' && (
                <button className="btn btn-ghost btn-sm" onClick={handlePause} disabled={acting}>
                  {acting ? 'Working…' : 'Pause'}
                </button>
              )}
              {campaign.status === 'paused' && (
                <button className="btn btn-ghost btn-sm" onClick={handleResume} disabled={acting}>
                  {acting ? 'Working…' : 'Resume'}
                </button>
              )}
              {(campaign.status === 'sent' || campaign.status === 'failed') && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowResend(true)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                    Send again
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={handleDuplicate}>Duplicate</button>
                </>
              )}
              {canEdit && (
                <button className="btn btn-ghost btn-sm" onClick={handleDuplicate}>Duplicate</button>
              )}
            </div>
          </div>

          <div className="detail-meta">
            {sentDate && (
              <div className="dm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <b>{formatDate(sentDate as Date)}{formatTime(sentDate as Date) ? ` · ${formatTime(sentDate as Date)}` : ''}</b>
              </div>
            )}
            <div className="dm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <b>{totalRecipients > 0 ? totalRecipients.toLocaleString() : sends.length}</b> recipient{(totalRecipients || sends.length) !== 1 ? 's' : ''}
              {suppressedCount > 0 && <span style={{ color: 'var(--slate)', fontWeight: 400 }}> · {suppressedCount} suppressed</span>}
            </div>
            <div className="dm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 6l-10 7L2 6"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
              From: <b>{campaign.fromName} &lt;{campaign.fromEmail}&gt;</b>
            </div>
            <div className="dm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Subject: <b>{campaign.subject}</b>
            </div>
          </div>

          {isSending && totalRecipients > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontFamily: 'var(--mono)', fontSize: 11 }}>
                <span style={{ color: 'var(--slate-3)' }}>Progress</span>
                <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{sentCount} / {totalRecipients} sent</span>
              </div>
              <div className="track" style={{ height: 8 }}>
                <div className="fill" style={{ width: `${Math.round((sentCount / totalRecipients) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {(isSent || isSending) && (
          <div className="stat-row">
            {[
              { label: 'Sent',          value: sentCount,    sub: pct(sentCount, totalRecipients),   cls: '' },
              { label: 'Delivered',     value: delivered,    sub: pct(delivered, sentCount),         cls: '' },
              { label: 'Opened',        value: opened,       sub: pct(opened, delivered),            cls: 'accent2' },
              { label: 'Clicked',       value: clicked,      sub: pct(clicked, opened),              cls: 'accent' },
              { label: 'Bounced',       value: bounced,      sub: pct(bounced, sentCount),           cls: '' },
            ].map(s => (
              <div key={s.label} className={`stat-cell${s.cls ? ` ${s.cls}` : ''}`}>
                <div className="sl">{s.label}</div>
                <div className="sv num">{s.value}</div>
                <div className="sr">{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
          <div className="card card-pad" style={{ marginTop: 16, textAlign: 'center', color: 'var(--slate)', padding: '32px 24px' }}>
            {campaign.status === 'draft'
              ? 'This campaign is a draft — stats will appear once it is sent.'
              : `Scheduled to send on ${formatDate(campaign.scheduledAt as Date)}${formatTime(campaign.scheduledAt as Date) ? ` at ${formatTime(campaign.scheduledAt as Date)}` : ''}.`}
          </div>
        )}

        {/* Recipients / Sends table */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <div>
              <h3>{hasSends ? 'Sends' : 'Recipients'}</h3>
              <div className="sub">
                {hasSends
                  ? `${sends.length} send${sends.length !== 1 ? 's' : ''}${unsubscribed > 0 ? ` · ${unsubscribed} suppressed` : ''}`
                  : 'Recipients will appear here once sending starts'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {someChecked && (
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--red)', color: '#fff', border: 'none' }}
                  onClick={() => setDeleteStep(1)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 5 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                  Delete {selectedIds.size} selected
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddRecipient(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                Add contact
              </button>
            </div>
          </div>
          <div className="table-card" style={{ border: 'none' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 44, paddingLeft: 16 }}>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                      onChange={toggleAll}
                      style={{ cursor: 'pointer', width: 15, height: 15 }}
                    />
                  </th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Contact status</th>
                  {hasSends && <th>Send status</th>}
                </tr>
              </thead>
              <tbody>
                {sends.length === 0 && (
                  <tr>
                    <td colSpan={hasSends ? 5 : 4} style={{ textAlign: 'center', padding: '32px', color: 'var(--slate)' }}>
                      {hasSends ? 'No send records yet.' : 'No recipients — this campaign has not been dispatched yet.'}
                    </td>
                  </tr>
                )}
                {sends.map((s) => {
                  const isChecked  = selectedIds.has(s.contactId);
                  const sendStatus = mapSendStatus(s.status);
                  const name       = contactName(s);
                  const ini        = initials(s.contactFirstName, s.contactLastName, s.contactEmail);
                  const bg         = avatarColor(s.contactEmail);
                  return (
                    <tr
                      key={s.id}
                      style={{ background: isChecked ? 'rgba(99,102,241,0.04)' : undefined, cursor: 'default' }}
                      onClick={() => toggleRow(s.contactId)}
                    >
                      <td style={{ paddingLeft: 16 }} onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRow(s.contactId)}
                          style={{ cursor: 'pointer', width: 15, height: 15 }}
                        />
                      </td>
                      <td>
                        <div className="cell-contact">
                          <span className="avatar" style={{ width: 30, height: 30, fontSize: 11, background: bg }}>{ini}</span>
                          <div className="t-name">{name}</div>
                        </div>
                      </td>
                      <td className="t-mono t-mute">{s.contactEmail}</td>
                      <td>
                        <Badge variant={s.contactStatus as ContactStatus}>
                          {s.contactStatus.charAt(0).toUpperCase() + s.contactStatus.slice(1)}
                        </Badge>
                      </td>
                      {hasSends && (
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: STATUS_COLOR[sendStatus] }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[sendStatus], flexShrink: 0 }} />
                            {STATUS_LABEL[sendStatus]}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {showResend && (
        <ResendModal campaign={campaign} onClose={() => setShowResend(false)} />
      )}

      {showEdit && (
        <EditModal campaign={campaign} onClose={() => setShowEdit(false)} onSaved={fetchData} />
      )}
      {showAddRecipient && (
        <AddRecipientModal onClose={() => setShowAddRecipient(false)} onAdded={fetchData} />
      )}
      {deleteStep > 0 && (
        <DeleteConfirmModal
          count={selectedIds.size}
          step={deleteStep as 1 | 2}
          onCancel={() => setDeleteStep(0)}
          onFirstConfirm={() => setDeleteStep(2)}
          onFinalConfirm={handleFinalConfirm}
        />
      )}
    </div>
  );
}
