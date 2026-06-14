import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { Badge } from '../../components/ui/Badge.js';
import { campaignsApi } from '../../lib/api/campaigns.js';
import { analyticsApi, type CampaignPerformanceRow } from '../../lib/api/analytics.js';
import type { Campaign, CampaignStatus } from '@bulksend/shared';

type TabKey = 'all' | CampaignStatus;

function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso as string);
  if (isNaN(d.getTime())) return '—';
  if (d.toDateString() === new Date().toDateString()) return 'Today';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function RateBar({ value, coral }: { value: number | null; coral?: boolean }) {
  if (value === null) return <span className="t-mute">—</span>;
  return (
    <div className="t-rate">
      <div className="rbar">
        <i className={coral ? 'c' : ''} style={{ width: `${Math.min(value * 1.4, 100)}%` }} />
      </div>
      <span className="rv">{value}%</span>
    </div>
  );
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'sending',   label: 'Sending' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'sent',      label: 'Sent' },
  { key: 'draft',     label: 'Draft' },
];

type MenuState = { campaignId: string; x: number; y: number } | null;

type PendingAction =
  | { type: 'pause';  campaign: Campaign }
  | { type: 'resume'; campaign: Campaign }
  | { type: 'delete'; campaign: Campaign };

const ACTION_CONFIG: Record<PendingAction['type'], {
  title: string;
  body: (name: string) => string;
  confirm: string;
  danger?: boolean;
}> = {
  pause:  { title: 'Pause campaign',  body: n => `Pause sending "${n}"? You can resume it at any time.`, confirm: 'Pause',  danger: false },
  resume: { title: 'Resume campaign', body: n => `Resume sending "${n}"?`,                               confirm: 'Resume', danger: false },
  delete: { title: 'Delete campaign', body: n => `Permanently delete "${n}"? This cannot be undone.`,    confirm: 'Delete', danger: true  },
};

export function CampaignsPage() {
  const navigate = useNavigate();
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();

  const [campaigns,  setCampaigns]  = useState<Campaign[]>([]);
  const [perfMap,    setPerfMap]    = useState<Record<string, CampaignPerformanceRow>>({});
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<TabKey>('all');
  const [menu,       setMenu]       = useState<MenuState>(null);
  const [pending,    setPending]    = useState<PendingAction | null>(null);
  const [acting,     setActing]     = useState(false);
  const [resendConfirm, setResendConfirm] = useState<Campaign | null>(null);
  const [resendName,    setResendName]    = useState('');

  const load = useCallback(async () => {
    const [{ items }, perfRows] = await Promise.all([
      campaignsApi.list(1, 200),
      analyticsApi.getCampaigns(200).catch(() => [] as CampaignPerformanceRow[]),
    ]);
    setCampaigns(items);
    const map: Record<string, CampaignPerformanceRow> = {};
    for (const r of perfRows) map[r.id] = r;
    setPerfMap(map);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const counts: Record<TabKey, number> = {
    all:       campaigns.length,
    sending:   campaigns.filter(c => c.status === 'sending').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    sent:      campaigns.filter(c => c.status === 'sent').length,
    draft:     campaigns.filter(c => c.status === 'draft').length,
    paused:    campaigns.filter(c => c.status === 'paused').length,
    failed:    campaigns.filter(c => c.status === 'failed').length,
  };

  const filtered = activeTab === 'all' ? campaigns : campaigns.filter(c => c.status === activeTab);
  const drafts   = counts.draft;
  const subline  = `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}${drafts > 0 ? ` · ${drafts} in draft` : ''}`;

  function openMenu(e: React.MouseEvent, campaignId: string) {
    e.stopPropagation();
    if (menu?.campaignId === campaignId) { setMenu(null); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu({ campaignId, x: rect.right, y: rect.bottom + 6 });
  }
  function closeMenu() { setMenu(null); }

  function ask(action: PendingAction) { closeMenu(); setPending(action); }

  async function handleConfirm() {
    if (!pending) return;
    setActing(true);
    try {
      if (pending.type === 'pause')  await campaignsApi.pause(pending.campaign.id);
      if (pending.type === 'resume') await campaignsApi.resume(pending.campaign.id);
      if (pending.type === 'delete') await campaignsApi.delete(pending.campaign.id);
      setPending(null);
      await load();
    } catch { /* keep dialog open on error */ }
    finally { setActing(false); }
  }

  async function handleDuplicate(campaign: Campaign) {
    closeMenu();
    try {
      const copy = await campaignsApi.create({
        name: `Copy of ${campaign.name}`,
        subject: campaign.subject,
        fromName: campaign.fromName,
        fromEmail: campaign.fromEmail,
        bodyHtml: campaign.bodyHtml,
        bodyText: campaign.bodyText,
        ...(campaign.previewText ? { previewText: campaign.previewText } : {}),
        ...(campaign.segmentId   ? { segmentId:   campaign.segmentId }   : {}),
      });
      navigate(`/campaigns/${copy.id}`);
    } catch { /* ignore */ }
  }

  function openResend(campaign: Campaign) { closeMenu(); setResendName(`${campaign.name} (resend)`); setResendConfirm(campaign); }

  async function handleResendAsIs() {
    if (!resendConfirm) return;
    try {
      const copy = await campaignsApi.create({
        name: resendName.trim() || `${resendConfirm.name} (resend)`,
        subject: resendConfirm.subject,
        fromName: resendConfirm.fromName,
        fromEmail: resendConfirm.fromEmail,
        bodyHtml: resendConfirm.bodyHtml,
        bodyText: resendConfirm.bodyText,
        ...(resendConfirm.previewText ? { previewText: resendConfirm.previewText } : {}),
        ...(resendConfirm.segmentId   ? { segmentId:   resendConfirm.segmentId }   : {}),
      });
      await campaignsApi.send(copy.id);
      setResendConfirm(null);
      await load();
    } catch { /* ignore */ }
  }

  function handleEditFirst() {
    if (!resendConfirm) return;
    navigate('/campaigns/new', { state: { resendFrom: resendConfirm } });
    setResendConfirm(null);
  }

  const menuCampaign = menu ? campaigns.find(c => c.id === menu.campaignId) : null;

  return (
    <div className="view active" onClick={closeMenu}>
      <Topbar crumb="Campaigns" title="Campaigns" onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 28px 60px' }}>

        <div className="view-head">
          <div className="vh-l">
            <h2>Campaigns</h2>
            <div className="vh-sub">{subline}</div>
          </div>
          <div className="vh-actions">
            <div className="tabs">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`tab${activeTab === key ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setActiveTab(key); }}
                >
                  {label}
                  {counts[key] > 0 && <span className="cnt">{counts[key]}</span>}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); navigate('/campaigns/new'); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              New campaign
            </button>
          </div>
        </div>

        <div className="table-card">
          {loading ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--slate)' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--slate-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>
              {activeTab === 'all' ? 'No campaigns yet' : `No ${activeTab} campaigns`}
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th className="hide-sm">Recipients</th>
                  <th>Open rate</th>
                  <th>Click rate</th>
                  <th className="hide-sm">Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const perf = perfMap[c.id];
                  return (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/campaigns/${c.id}`)}>
                      <td>
                        <div className="t-name">{c.name}</div>
                        <div className="t-sub">{c.subject}</div>
                      </td>
                      <td><Badge variant={c.status} pulse={c.status === 'sending'}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</Badge></td>
                      <td className="hide-sm t-mono">{c.totalRecipients > 0 ? c.totalRecipients.toLocaleString() : '—'}</td>
                      <td><RateBar value={perf?.openRate  ?? null} /></td>
                      <td><RateBar value={perf?.clickRate ?? null} coral /></td>
                      <td className="hide-sm t-mute">{formatDate((c.sentAt ?? c.scheduledAt ?? c.createdAt) as unknown as string)}</td>
                      <td className="t-actions" onClick={e => e.stopPropagation()}>
                        <button className="t-more" onClick={e => openMenu(e, c.id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Context menu */}
      {menu && menuCampaign && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed', top: menu.y, left: menu.x, transform: 'translateX(-100%)',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.14)', padding: '4px 0', minWidth: 168, zIndex: 1000,
          }}
        >
          {menuCampaign.status === 'sending' && (
            <MenuItem icon="⏸" label="Pause" onClick={() => ask({ type: 'pause', campaign: menuCampaign })} />
          )}
          {menuCampaign.status === 'paused' && (
            <MenuItem icon="▶" label="Resume" onClick={() => ask({ type: 'resume', campaign: menuCampaign })} />
          )}
          {menuCampaign.status === 'paused' && (
            <MenuItem icon="✎" label="Edit & resend" onClick={() => openResend(menuCampaign)} />
          )}
          {(menuCampaign.status === 'sent' || menuCampaign.status === 'failed') && (
            <MenuItem icon="↺" label="Resend" onClick={() => openResend(menuCampaign)} />
          )}
          <MenuItem icon="⧉" label="Duplicate" onClick={() => handleDuplicate(menuCampaign)} />
          {!['sending', 'sent'].includes(menuCampaign.status) && (
            <MenuItem icon="✕" label="Delete" danger onClick={() => ask({ type: 'delete', campaign: menuCampaign })} />
          )}
        </div>
      )}

      {/* Generic confirm dialog */}
      {pending && (() => {
        const cfg = ACTION_CONFIG[pending.type];
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={() => !acting && setPending(null)}
          >
            <div
              style={{ background: 'var(--surface)', borderRadius: 12, padding: '28px 28px 24px', width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>{cfg.title}</h3>
              <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--slate)', lineHeight: 1.5 }}>
                {cfg.body(pending.campaign.name)}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPending(null)} disabled={acting}>Cancel</button>
                <button
                  className={`btn btn-sm ${cfg.danger ? 'btn-coral' : 'btn-primary'}`}
                  onClick={handleConfirm}
                  disabled={acting}
                >
                  {acting ? 'Working…' : cfg.confirm}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Resend confirmation */}
      {resendConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setResendConfirm(null)}
        >
          <div
            style={{ background: 'var(--surface)', borderRadius: 12, padding: '28px 28px 24px', width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>Send again?</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--slate)' }}>
              Do you want to edit <strong>{resendConfirm.name}</strong> before sending?
            </p>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--slate)', marginBottom: 4 }}>Campaign name</label>
            <input
              type="text"
              value={resendName}
              onChange={e => setResendName(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', marginBottom: 20,
                padding: '8px 10px', fontSize: 13, borderRadius: 6,
                border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
                outline: 'none',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setResendConfirm(null)}>Cancel</button>
              <button className="btn btn-ghost btn-sm" onClick={handleResendAsIs}>Send as-is</button>
              <button className="btn btn-primary btn-sm" onClick={handleEditFirst}>Edit first →</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px',
        background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left',
        color: danger ? 'var(--red)' : 'var(--text)',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      <span style={{ fontSize: 12, width: 16, textAlign: 'center' }}>{icon}</span>
      {label}
    </button>
  );
}
