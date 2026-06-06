import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { Badge } from '../../components/ui/Badge.js';
import { DeliveryFunnel } from '../../components/charts/DeliveryFunnel.js';
import { VolumeChart } from '../../components/charts/VolumeChart.js';

const engData = Array.from({ length: 16 }, (_, i) => {
  const peak = Math.exp(-Math.pow((i - 3) / 4, 2));
  const o = Math.round(peak * 3200 + 120);
  return { delivered: o, opened: Math.round(o * 0.32) };
});
const engLabels = ['0h', '', '', '4h', '', '', '8h', '', '', '12h', '', '', '16h', '', '', '20h'];

const funnelSteps = [
  { label: 'Delivered', value: 47820, total: 48210, color: 'var(--indigo)' },
  { label: 'Opened', value: 29436, total: 48210, color: 'var(--green)' },
  { label: 'Clicked', value: 8677, total: 48210, color: 'var(--coral)' },
  { label: 'Unsubscribed', value: 120, total: 48210, color: 'var(--amber)' },
  { label: 'Bounced', value: 390, total: 48210, color: 'var(--red)' },
];

const topLinks = [
  { url: 'acme.co/spring/upgrade', clicks: 4210 },
  { url: 'acme.co/blog/what-is-new', clicks: 2103 },
  { url: 'acme.co/pricing', clicks: 1890 },
  { url: 'acme.co/features', clicks: 474 },
];

export function CampaignDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();

  return (
    <div className="view active">
      <Topbar crumb="Campaigns" title="Spring Launch 2026" onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>

        <button className="back-link" onClick={() => navigate('/campaigns')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to campaigns
        </button>

        <div className="detail-head">
          <div className="detail-top">
            <h2>
              Spring Launch 2026
              <Badge variant="sending" pulse>Sending</Badge>
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm">Pause</button>
              <button className="btn btn-ghost btn-sm">Duplicate</button>
            </div>
          </div>
          <div className="detail-meta">
            <div className="dm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              <b>Jun 5, 2026 · 9:00 AM</b>
            </div>
            <div className="dm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>
              Segment: <b>Active subscribers</b>
            </div>
            <div className="dm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <b>48,210</b> recipients
            </div>
            <div className="dm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 6l-10 7L2 6"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
              From: <b>Acme Team &lt;hello@acme.co&gt;</b>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontFamily: 'var(--mono)', fontSize: 11 }}>
              <span style={{ color: 'var(--slate-3)' }}>Progress</span>
              <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>35,100 / 48,210 sent · 73%</span>
            </div>
            <div className="track" style={{ height: 8 }}>
              <div className="fill" style={{ width: '73%' }} />
            </div>
          </div>
        </div>

        <div className="stat-row">
          {[
            { label: 'Sent', value: '35,100', sub: '73% of total', cls: '' },
            { label: 'Delivered', value: '34,780', sub: '99.1%', cls: 'accent2' },
            { label: 'Opened', value: '21,436', sub: '61.6%', cls: 'accent2' },
            { label: 'Clicked', value: '6,322', sub: '18.1%', cls: 'accent' },
            { label: 'Bounced', value: '320', sub: '0.9%', cls: '' },
            { label: 'Unsubscribed', value: '87', sub: '0.2%', cls: '' },
          ].map((s) => (
            <div key={s.label} className={`stat-cell${s.cls ? ` ${s.cls}` : ''}`}>
              <div className="sl">{s.label}</div>
              <div className="sv num">{s.value}</div>
              <div className="sr">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="two-col">
          <div className="card">
            <div className="card-head">
              <div><h3>Engagement over time</h3><div className="sub">Opens and clicks since send</div></div>
              <div className="legend">
                <div className="li"><i style={{ background: 'var(--indigo)' }} /> Opens</div>
                <div className="li"><i style={{ background: 'var(--coral)' }} /> Clicks</div>
              </div>
            </div>
            <div className="card-pad">
              <VolumeChart data={engData} labels={engLabels} />
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Delivery funnel</h3></div>
            <div className="card-pad">
              <DeliveryFunnel steps={funnelSteps} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head"><h3>Top clicked links</h3></div>
          <div className="table-card" style={{ border: 'none' }}>
            <table className="tbl">
              <thead><tr><th>URL</th><th>Clicks</th></tr></thead>
              <tbody>
                {topLinks.map((l) => (
                  <tr key={l.url}>
                    <td className="t-mono">{l.url}</td>
                    <td className="t-mono">{l.clicks.toLocaleString()}</td>
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
