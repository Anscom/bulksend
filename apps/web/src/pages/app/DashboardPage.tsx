import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { KPICard } from '../../components/charts/KPICard.js';
import { VolumeChart } from '../../components/charts/VolumeChart.js';
import { Badge } from '../../components/ui/Badge.js';
import { analyticsApi } from '../../lib/api/analytics.js';
import { campaignsApi } from '../../lib/api/campaigns.js';
import type { AnalyticsOverview, VolumePoint, Campaign } from '@bulksend/shared';

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return n.toLocaleString();
  return String(n);
}

function trendProp(delta: number): { direction: 'up' | 'down'; value: string } {
  return { direction: delta >= 0 ? 'up' : 'down', value: `${Math.abs(delta)}%` };
}

function volLabels(points: VolumePoint[]): string[] {
  return points.map((p, i) => {
    const d = new Date(p.date);
    const dow = d.getDay();
    // Show label on Mondays and every 7th day to avoid clutter
    return dow === 1 || i === 0 || i === points.length - 1
      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
  });
}

const kpiIcons = [
  <svg key="s" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>,
  <svg key="d" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>,
  <svg key="o" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>,
  <svg key="c" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
];

function campaignDate(c: Campaign): string {
  const d = c.sentAt ?? c.scheduledAt ?? c.createdAt;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function DashboardPage() {
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [volume, setVolume] = useState<VolumePoint[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.getOverview(),
      analyticsApi.getVolume(30),
      campaignsApi.list(1, 5),
    ]).then(([ov, vol, clist]) => {
      setOverview(ov);
      setVolume(vol);
      setCampaigns(clist.items);
    }).catch(() => {
      // leave loading=false so the page renders empty rather than spinning forever
    }).finally(() => setLoading(false));
  }, []);

  const kpiData = overview
    ? [
        { label: 'Emails sent',     value: fmt(overview.totalSent),       trend: trendProp(overview.sentTrend),      footnote: 'vs last 30 days', variant: 'default' as const },
        { label: 'Delivery rate',   value: `${overview.deliveryRate}%`,    trend: trendProp(overview.deliveryTrend), footnote: 'vs last 30 days', variant: 'green'   as const },
        { label: 'Open rate',       value: `${overview.openRate}%`,        trend: trendProp(overview.openTrend),     footnote: 'vs last 30 days', variant: 'coral'   as const },
        { label: 'Active contacts', value: fmt(overview.activeContacts),   trend: trendProp(overview.contactsTrend), footnote: 'subscribed',      variant: 'amber'   as const },
      ]
    : null;

  const volData   = volume.map(p => ({ delivered: p.delivered, opened: p.opened }));
  const volLbls   = volume.length ? volLabels(volume) : [];

  return (
    <div className="view active">
      <Topbar crumb="Dashboard" title="Dashboard" onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>

        <div className="kpi-grid">
          {loading || !kpiData
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="kpi" style={{ opacity: 0.4 }}>
                  <div className="kl"><span className="ki" />&nbsp;</div>
                  <div className="kv num">—</div>
                </div>
              ))
            : kpiData.map((k, i) => (
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
              {volData.length > 0
                ? <VolumeChart data={volData} labels={volLbls} />
                : <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>No data yet</div>
              }
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Recent campaigns</h3></div>
            <div className="table-card" style={{ border: 'none' }}>
              {loading
                ? <div style={{ padding: '24px', color: 'var(--muted)' }}>Loading…</div>
                : campaigns.length === 0
                  ? <div style={{ padding: '24px', color: 'var(--muted)' }}>No campaigns yet</div>
                  : (
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Campaign</th>
                            <th>Status</th>
                            <th className="hide-sm">Recipients</th>
                            <th className="hide-sm">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaigns.map((c) => (
                            <tr key={c.id}>
                              <td><div className="t-name">{c.name}</div></td>
                              <td><Badge variant={c.status} pulse={c.status === 'sending'}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</Badge></td>
                              <td className="hide-sm t-mono">{c.totalRecipients.toLocaleString()}</td>
                              <td className="hide-sm t-mute">{campaignDate(c)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
              }
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
