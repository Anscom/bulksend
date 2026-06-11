import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { Badge } from '../../components/ui/Badge.js';
import type { CampaignStatus } from '@bulksend/shared';

type TabKey = 'all' | CampaignStatus;

const campaigns = [
  { id: '1', name: 'Spring Launch 2026', sub: 'Your spring upgrade is here ✨', status: 'sending' as CampaignStatus, seg: 'Active subscribers', rec: '48,210', open: 61, click: 18, date: 'Today' },
  { id: '2', name: 'Weekly Digest · Wk 23', sub: 'This week at Acme', status: 'sent' as CampaignStatus, seg: 'All subscribers', rec: '46,980', open: 54, click: 12, date: 'Jun 2' },
  { id: '3', name: 'Product Update — v4.2', sub: 'Faster sending, new analytics', status: 'sent' as CampaignStatus, seg: 'Pro & Enterprise', rec: '12,440', open: 67, click: 24, date: 'May 28' },
  { id: '4', name: 'Re-engagement Flow', sub: "We miss you — here's 20% off", status: 'sent' as CampaignStatus, seg: 'Inactive 90d', rec: '8,210', open: 31, click: 7, date: 'May 24' },
  { id: '5', name: 'Onboarding Drip 3/5', sub: 'Set up your first campaign', status: 'sent' as CampaignStatus, seg: 'New signups', rec: '3,180', open: 72, click: 38, date: 'May 21' },
  { id: '6', name: 'June Newsletter', sub: 'Summer feature roundup', status: 'scheduled' as CampaignStatus, seg: 'All subscribers', rec: '47,020', open: null, click: null, date: 'Jun 8' },
  { id: '7', name: 'Webinar Invite', sub: 'Join us live Thursday', status: 'scheduled' as CampaignStatus, seg: 'Pro & Enterprise', rec: '12,500', open: null, click: null, date: 'Jun 11' },
  { id: '8', name: 'Black Friday Teaser', sub: 'Something big is coming', status: 'draft' as CampaignStatus, seg: '—', rec: '—', open: null, click: null, date: 'Draft' },
];

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
  { key: 'all', label: 'All' },
  { key: 'sending', label: 'Sending' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'sent', label: 'Sent' },
  { key: 'draft', label: 'Draft' },
];

export function CampaignsPage() {
  const navigate = useNavigate();
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const counts: Record<TabKey, number> = {
    all: campaigns.length,
    sending: campaigns.filter(c => c.status === 'sending').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    failed: campaigns.filter(c => c.status === 'failed').length,
  };

  const filtered = activeTab === 'all' ? campaigns : campaigns.filter(c => c.status === activeTab);

  const drafts = counts.draft;
  const subline = `${campaigns.length} campaigns${drafts > 0 ? ` · ${drafts} in draft` : ''}`;

  return (
    <div className="view active">
      <Topbar crumb="Acme Marketing" title="Campaigns" onMenuOpen={onMenuOpen} />
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
                  onClick={() => setActiveTab(key)}
                >
                  {label}
                  {counts[key] > 0 && <span className="cnt">{counts[key]}</span>}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/campaigns/new')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              New campaign
            </button>
          </div>
        </div>

        <div className="table-card">
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--slate-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>
              No {activeTab} campaigns
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th className="hide-sm">Segment</th>
                  <th className="hide-sm">Recipients</th>
                  <th>Open rate</th>
                  <th>Click rate</th>
                  <th className="hide-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/campaigns/${c.id}`)}>
                    <td>
                      <div className="t-name">{c.name}</div>
                      <div className="t-sub">{c.sub}</div>
                    </td>
                    <td><Badge variant={c.status} pulse={c.status === 'sending'}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</Badge></td>
                    <td className="hide-sm t-mute">{c.seg}</td>
                    <td className="hide-sm t-mono">{c.rec}</td>
                    <td><RateBar value={c.open} /></td>
                    <td><RateBar value={c.click} coral /></td>
                    <td className="hide-sm t-mute">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
