import { useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { KPICard } from '../../components/charts/KPICard.js';
import { VolumeChart } from '../../components/charts/VolumeChart.js';
import { Badge } from '../../components/ui/Badge.js';

// Realistic sample data — replace with API calls
const kpiData = [
  { label: 'Emails sent', value: '2.34M', trend: { direction: 'up' as const, value: '12%' }, footnote: 'vs last 30 days', variant: 'default' as const },
  { label: 'Delivery rate', value: '98.2%', trend: { direction: 'up' as const, value: '0.3%' }, footnote: 'vs last 30 days', variant: 'green' as const },
  { label: 'Open rate', value: '54.1%', trend: { direction: 'up' as const, value: '2.1%' }, footnote: 'vs last 30 days', variant: 'coral' as const },
  { label: 'Active contacts', value: '48,210', trend: { direction: 'up' as const, value: '3.4%' }, footnote: 'subscribed', variant: 'amber' as const },
];

const volData = Array.from({ length: 30 }, (_, i) => {
  const base = 28000 + Math.round(Math.sin(i / 3) * 9000) + i * 350;
  return { delivered: base, opened: Math.round(base * 0.55) };
});

const volLabels = ['May 6', '', '', '', 'May 13', '', '', '', 'May 20', '', '', '', 'May 27', '', '', 'Jun 4'].concat(Array(14).fill(''));

const feedData = [
  { type: 'open' as const, html: '<b>maya.chen@gmail.com</b> opened Spring Launch 2026', time: '2s ago' },
  { type: 'click' as const, html: '<b>liam.patel@acme.co</b> clicked acme.co/spring/upgrade', time: '5s ago' },
  { type: 'open' as const, html: '<b>sofia.rivera@hey.com</b> opened Spring Launch 2026', time: '11s ago' },
  { type: 'send' as const, html: 'Delivered <b>1,204</b> emails to Active subscribers', time: '18s ago' },
  { type: 'bounce' as const, html: '<b>noah.kim@outlook.com</b> hard bounced', time: '24s ago' },
  { type: 'unsub' as const, html: '<b>ava.okafor@gmail.com</b> unsubscribed', time: '40s ago' },
];

const recentCampaigns = [
  { id: '1', name: 'Spring Launch 2026', status: 'sending' as const, recipients: '48,210', openRate: 61, date: 'Today' },
  { id: '2', name: 'Weekly Digest · Wk 23', status: 'sent' as const, recipients: '46,980', openRate: 54, date: 'Jun 2' },
  { id: '3', name: 'Product Update — v4.2', status: 'sent' as const, recipients: '12,440', openRate: 67, date: 'May 28' },
  { id: '4', name: 'Re-engagement Flow', status: 'sent' as const, recipients: '8,210', openRate: 31, date: 'May 24' },
  { id: '5', name: 'June Newsletter', status: 'scheduled' as const, recipients: '47,020', openRate: null, date: 'Jun 8' },
];

const feedIcons: Record<string, React.ReactNode> = {
  open:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>,
  click:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 9 2-5 5-2z"/></svg>,
  bounce: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  unsub:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>,
  send:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>,
};

const kpiIcons = [
  <svg key="s" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>,
  <svg key="d" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>,
  <svg key="o" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>,
  <svg key="c" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
];

export function DashboardPage() {
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();

  return (
    <div className="view active">
      <Topbar crumb="Acme Marketing" title="Dashboard" onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>

        <div className="kpi-grid">
          {kpiData.map((k, i) => (
            <KPICard
              key={k.label}
              label={k.label}
              value={k.value}
              trend={k.trend}
              footnote={k.footnote}
              iconVariant={k.variant}
              icon={kpiIcons[i]}
            />
          ))}
        </div>

        <div className="two-col">
          <div className="card">
            <div className="card-head">
              <div>
                <h3>Sending volume</h3>
                <div className="sub">Last 30 days</div>
              </div>
              <div className="legend">
                <div className="li"><i style={{ background: 'var(--indigo)' }} /> Delivered</div>
                <div className="li"><i style={{ background: 'var(--indigo-tint2)' }} /> Opened</div>
              </div>
            </div>
            <div className="card-pad">
              <VolumeChart data={volData} labels={volLabels.slice(0, 30)} />
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Live event feed</h3></div>
            <div className="card-pad">
              <div className="feed">
                {feedData.map((f, i) => (
                  <div key={i} className="feed-item">
                    <div className={`feed-ico ${f.type}`}>{feedIcons[f.type]}</div>
                    <div className="feed-body">
                      <div className="ft" dangerouslySetInnerHTML={{ __html: f.html }} />
                      <div className="fm">{f.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <h3>Recent campaigns</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => {}}>View all</button>
          </div>
          <div className="table-card" style={{ border: 'none' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th className="hide-sm">Recipients</th>
                  <th>Open rate</th>
                  <th className="hide-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((c) => (
                  <tr key={c.id}>
                    <td><div className="t-name">{c.name}</div></td>
                    <td><Badge variant={c.status} pulse={c.status === 'sending'}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</Badge></td>
                    <td className="hide-sm t-mono">{c.recipients}</td>
                    <td>
                      {c.openRate !== null ? (
                        <div className="t-rate">
                          <div className="rbar"><i style={{ width: `${Math.min(c.openRate * 1.4, 100)}%` }} /></div>
                          <span className="rv">{c.openRate}%</span>
                        </div>
                      ) : <span className="t-mute">—</span>}
                    </td>
                    <td className="hide-sm t-mute">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
