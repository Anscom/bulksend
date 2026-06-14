import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { KPICard } from '../../components/charts/KPICard.js';
import { VolumeChart } from '../../components/charts/VolumeChart.js';
import { Badge } from '../../components/ui/Badge.js';
import { analyticsApi, type CampaignPerformanceRow } from '../../lib/api/analytics.js';
import type { AnalyticsOverview, VolumePoint, CampaignStatus } from '@bulksend/shared';

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return n.toLocaleString();
  return String(n);
}

function pct(n: number): string { return `${n}%`; }

function trendProp(delta: number): { direction: 'up' | 'down'; value: string } {
  return { direction: delta >= 0 ? 'up' : 'down', value: `${Math.abs(delta)}%` };
}

function volLabels(points: VolumePoint[], days: number): string[] {
  return points.map((p, i) => {
    const d = new Date(p.date);
    if (days <= 14) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    const dow = d.getDay();
    return (dow === 1 || i === 0 || i === points.length - 1)
      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
  });
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function RateBar({ value, color = 'var(--indigo)' }: { value: number; color?: string }) {
  return (
    <div className="t-rate">
      <div className="rbar"><i style={{ width: `${Math.min(value * 1.4, 100)}%`, background: color }} /></div>
      <span className="rv">{value}%</span>
    </div>
  );
}

const kpiIcons = [
  <svg key="s" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>,
  <svg key="d" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>,
  <svg key="o" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>,
  <svg key="c" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
];

const DAY_OPTIONS = [7, 14, 30, 90] as const;
type Days = typeof DAY_OPTIONS[number];

export function AnalyticsPage() {
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();
  const navigate = useNavigate();

  const [days, setDays] = useState<Days>(30);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [volume, setVolume] = useState<VolumePoint[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [volLoading, setVolLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      analyticsApi.getOverview(),
      analyticsApi.getVolume(days),
      analyticsApi.getCampaigns(20),
    ]).then(([ov, vol, clist]) => {
      setOverview(ov);
      setVolume(vol);
      setCampaigns(clist);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function changeRange(d: Days) {
    setDays(d);
    setVolLoading(true);
    analyticsApi.getVolume(d).then(vol => setVolume(vol)).catch(() => {}).finally(() => setVolLoading(false));
  }

  const kpiData = overview ? [
    { label: 'Emails sent',     value: fmt(overview.totalSent),      trend: trendProp(overview.sentTrend),      footnote: `vs prior ${days}d`, variant: 'default' as const },
    { label: 'Delivery rate',   value: pct(overview.deliveryRate),   trend: trendProp(overview.deliveryTrend), footnote: `vs prior ${days}d`, variant: 'green'   as const },
    { label: 'Open rate',       value: pct(overview.openRate),       trend: trendProp(overview.openTrend),     footnote: `vs prior ${days}d`, variant: 'coral'   as const },
    { label: 'Active contacts', value: fmt(overview.activeContacts), trend: trendProp(overview.contactsTrend), footnote: 'subscribed',        variant: 'amber'   as const },
  ] : null;

  const volData  = volume.map(p => ({ delivered: p.delivered, opened: p.opened }));
  const volLbls  = volume.length ? volLabels(volume, days) : [];

  return (
    <div className="view active">
      <Topbar crumb="Analytics" title="Analytics" onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>

        {/* KPI cards */}
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

        {/* Volume chart */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-head">
            <div>
              <h3>Sending volume</h3>
              <div className="sub">Delivered vs opened</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="legend">
                <div className="li"><i style={{ background: 'var(--indigo)' }} /> Delivered</div>
                <div className="li"><i style={{ background: 'var(--indigo-tint2)' }} /> Opened</div>
              </div>
              <div className="tabs">
                {DAY_OPTIONS.map(d => (
                  <button key={d} className={`tab${days === d ? ' active' : ''}`} onClick={() => changeRange(d)}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="card-pad">
            {volLoading
              ? <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading…</div>
              : volData.length > 0
                ? <VolumeChart data={volData} labels={volLbls} />
                : <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-3)' }}>No data yet</div>
            }
          </div>
        </div>

        {/* Campaign performance table */}
        <div className="table-card">
          <div className="card-head" style={{ borderRadius: 'var(--r-lg) var(--r-lg) 0 0' }}>
            <div>
              <h3>Campaign performance</h3>
              <div className="sub">Sent &amp; sending campaigns</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/events')}>View event stream →</button>
          </div>
          {loading
            ? <div style={{ padding: '24px', color: 'var(--slate)' }}>Loading…</div>
            : campaigns.length === 0
              ? <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--slate)' }}>No sent campaigns yet</div>
              : (
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Campaign</th>
                        <th>Status</th>
                        <th className="hide-sm">Sent</th>
                        <th>Open rate</th>
                        <th className="hide-sm">Click rate</th>
                        <th className="hide-sm">Bounce rate</th>
                        <th className="hide-sm">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map(c => (
                        <tr key={c.id} onClick={() => navigate(`/campaigns/${c.id}`)}>
                          <td><div className="t-name">{c.name}</div></td>
                          <td><Badge variant={c.status as CampaignStatus} pulse={c.status === 'sending'}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</Badge></td>
                          <td className="hide-sm t-mono">{fmt(c.totalRecipients)}</td>
                          <td><RateBar value={c.openRate} /></td>
                          <td className="hide-sm"><RateBar value={c.clickRate} color="var(--coral)" /></td>
                          <td className="hide-sm"><RateBar value={c.bounceRate} color="var(--red)" /></td>
                          <td className="hide-sm t-mute">{formatDate(c.sentAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
          }
        </div>

      </div>
    </div>
  );
}
