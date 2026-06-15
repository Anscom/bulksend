import { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { KPICard } from '../../components/charts/KPICard.js';
import { VolumeChart } from '../../components/charts/VolumeChart.js';
import { Badge } from '../../components/ui/Badge.js';
import { analyticsApi } from '../../lib/api/analytics.js';
import { campaignsApi } from '../../lib/api/campaigns.js';
import { contactsApi } from '../../lib/api/contacts.js';
import { segmentsApi } from '../../lib/api/segments.js';
import { useWorkspaceStore } from '../../stores/workspace.store.js';
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

function OnboardingChecklist({ brevoReady, senderReady, hasContacts, hasSegments, hasCampaigns }: {
  brevoReady: boolean; senderReady: boolean; hasContacts: boolean; hasSegments: boolean; hasCampaigns: boolean;
}) {
  const steps = [
    {
      title: 'Connect Brevo',
      desc: 'Create a free Brevo account, generate an API key, and set your sender email in Settings.',
      done: brevoReady && senderReady,
      partialNote: !brevoReady ? 'API key missing' : !senderReady ? 'Sender email missing' : undefined,
      cta: 'Go to Settings',
      to: '/settings',
    },
    {
      title: 'Import or add contacts',
      desc: 'Upload a CSV file or add contacts manually. Contacts are the people you\'ll be emailing.',
      done: hasContacts,
      cta: 'Go to Contacts',
      to: '/contacts',
    },
    {
      title: 'Create a segment',
      desc: 'Segments let you filter contacts by attributes (e.g. location, tags) so you can target the right audience.',
      done: hasSegments,
      cta: 'Go to Segments',
      to: '/segments',
    },
    {
      title: 'Send your first campaign',
      desc: 'Compose an email, pick a segment, and hit send. Your campaign will be delivered via Brevo.',
      done: hasCampaigns,
      cta: 'Create campaign',
      to: '/campaigns/new',
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  if (completedCount === steps.length) return null;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r)',
      padding: '24px 28px',
      marginBottom: 28,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Get started with BulkSend</h2>
          <div style={{ fontSize: 13, color: 'var(--slate)' }}>{completedCount} of {steps.length} steps complete</div>
        </div>
        <div style={{
          height: 6, width: 120, borderRadius: 99,
          background: 'var(--border)', overflow: 'hidden', flexShrink: 0,
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'var(--indigo)',
            width: `${(completedCount / steps.length) * 100}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '14px 16px',
            borderRadius: 'var(--r)',
            background: step.done ? 'transparent' : 'var(--surface-raised, rgba(99,102,241,0.04))',
            border: `1px solid ${step.done ? 'var(--border)' : 'var(--indigo-tint2, rgba(99,102,241,0.15))'}`,
            opacity: step.done ? 0.55 : 1,
          }}>
            <div style={{
              flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step.done ? 'var(--green, #16a34a)' : 'var(--indigo)',
              color: '#fff', fontSize: 12, fontWeight: 700,
            }}>
              {step.done
                ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : i + 1
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{step.title}</span>
                {step.partialNote && (
                  <span style={{ fontSize: 11, color: 'var(--amber, #d97706)', background: 'var(--amber-tint, #fef3c7)', padding: '2px 7px', borderRadius: 99, fontWeight: 600 }}>
                    {step.partialNote}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--slate)', lineHeight: 1.5 }}>{step.desc}</div>
            </div>
            {!step.done && (
              <Link to={step.to} style={{
                flexShrink: 0, fontSize: 12, fontWeight: 600,
                color: 'var(--indigo)', textDecoration: 'none',
                padding: '6px 12px',
                border: '1px solid var(--indigo)',
                borderRadius: 'var(--r)',
                whiteSpace: 'nowrap',
              }}>
                {step.cta} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();
  const workspace = useWorkspaceStore(s => s.workspace);

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [volume, setVolume] = useState<VolumePoint[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [segmentsTotal, setSegmentsTotal] = useState(0);

  useEffect(() => {
    Promise.all([
      analyticsApi.getOverview(),
      analyticsApi.getVolume(30),
      campaignsApi.list(1, 5),
      contactsApi.list(1),
      segmentsApi.list(1, 1),
    ]).then(([ov, vol, clist, contacts, segments]) => {
      setOverview(ov);
      setVolume(vol);
      setCampaigns(clist.items);
      setContactsTotal(contacts.total);
      setSegmentsTotal(segments.total);
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

        {!loading && workspace?.plan === 'free' && (
          <OnboardingChecklist
            brevoReady={!!workspace.brevoApiKey}
            senderReady={!!workspace.senderEmail}
            hasContacts={contactsTotal > 0}
            hasSegments={segmentsTotal > 0}
            hasCampaigns={campaigns.length > 0}
          />
        )}

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
