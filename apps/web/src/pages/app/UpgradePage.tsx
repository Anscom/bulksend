import { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { useWorkspaceStore } from '../../stores/workspace.store.js';
import { contactsApi } from '../../lib/api/contacts.js';
import { analyticsApi } from '../../lib/api/analytics.js';
import { billingApi } from '../../lib/api/billing.js';

type PlanId = 'free' | 'pro' | 'enterprise';

interface PlanDef {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  highlight: string;
  contacts: string;
  workspaces: string;
  features: string[];
  locked: string[];
  cta: string;
  popular: boolean;
}

const PLANS: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    highlight: '100 emails / hour',
    contacts: '5,000 contacts',
    workspaces: '1 workspace',
    features: ['Basic analytics', 'SendGrid integration', 'Community support'],
    locked: ['Custom sending domains', 'Full analytics suite', 'Priority support', 'A/B testing'],
    cta: 'Current plan',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$20',
    period: '/month',
    highlight: '2,000 emails / hour',
    contacts: '100,000 contacts',
    workspaces: 'Unlimited workspaces',
    features: [
      'Full analytics suite',
      'Custom sending domains',
      'Priority support',
      'A/B testing',
      'Advanced segmentation',
      'Remove BulkSend branding',
    ],
    locked: [],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    highlight: 'Custom rate limits',
    contacts: 'Unlimited contacts',
    workspaces: 'Unlimited workspaces',
    features: [
      'Everything in Pro',
      'Dedicated infrastructure',
      'SLA guarantee (99.9%)',
      'SSO / SAML',
      'Dedicated CSM',
      'Custom integrations',
    ],
    locked: [],
    cta: 'Contact sales',
    popular: false,
  },
];

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from billing settings and you keep Pro access until the end of your billing period. No penalties.',
  },
  {
    q: 'What happens if I hit my contact limit?',
    a: 'Campaigns keep sending to existing contacts. New imports are paused until you upgrade or clean up your list.',
  },
  {
    q: 'Is there a free trial for Pro?',
    a: 'Yes — 14 days free, no credit card required. You\'ll only be charged after the trial ends.',
  },
];

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2, opacity: 0.35 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function UsageBar({ label, used, limit, unit = '' }: { label: string; used: number; limit: number; unit?: string }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const isHigh = pct >= 80;
  const fillColor = isHigh ? 'var(--amber)' : 'linear-gradient(90deg, var(--indigo), var(--coral))';

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--slate)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 600, color: isHigh ? 'var(--amber)' : 'var(--ink-2)' }}>
          {used.toLocaleString()}{unit} / {limit.toLocaleString()}{unit}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 20, background: 'var(--line)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 20, background: fillColor, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

export function UpgradePage() {
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState('');
  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'done' | 'error'>('idle');
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPlan = (workspace?.plan ?? 'free') as 'free' | 'pro' | 'enterprise';

  const successMsg = searchParams.get('success') === 'true' || verifyState === 'done'
    ? 'Payment successful! Your plan has been upgraded to Pro.'
    : null;
  const cancelMsg = searchParams.get('canceled') === 'true'
    ? 'Checkout canceled — no changes were made.'
    : null;

  // On Stripe redirect back, verify the session and upgrade the plan immediately
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const isSuccess = searchParams.get('success') === 'true';
    setSearchParams({}, { replace: true });

    if (!isSuccess || !sessionId) return;

    setVerifyState('verifying');
    billingApi.verifySession(sessionId)
      .then(() => {
        if (workspace) setWorkspace({ ...workspace, plan: 'pro', sendRatePerHour: 2000 });
        setVerifyState('done');
      })
      .catch(() => setVerifyState('error'));
  }, []);

  const [usageData, setUsageData] = useState({
    contacts: { used: 0, limit: workspace?.sendRatePerHour ?? 100 },
    sendRate: { used: 0, limit: workspace?.sendRatePerHour ?? 100 },
  });

  useEffect(() => {
    Promise.all([contactsApi.list(1), analyticsApi.getUsage()]).then(([contacts, usage]) => {
      setUsageData({
        contacts: { used: contacts.total, limit: currentPlan === 'free' ? 5000 : 100_000 },
        sendRate: { used: usage.sendsThisHour, limit: usage.planLimit },
      });
    }).catch(() => {});
  }, [currentPlan]);

  async function handleUpgrade() {
    setBillingError('');
    setBillingLoading(true);
    try {
      const { url } = await billingApi.createCheckout();
      window.location.href = url;
    } catch (err: unknown) {
      setBillingError(err instanceof Error ? err.message : 'Failed to start checkout');
      setBillingLoading(false);
    }
  }

  async function handleManage() {
    setBillingError('');
    setBillingLoading(true);
    try {
      const { url } = await billingApi.createPortal();
      window.location.href = url;
    } catch (err: unknown) {
      setBillingError(err instanceof Error ? err.message : 'Failed to open billing portal');
      setBillingLoading(false);
    }
  }

  const currentPlanDef = PLANS.find(p => p.id === currentPlan)!;
  const isOnFree = currentPlan === 'free';

  const sectionHead: React.CSSProperties = {
    fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase',
    letterSpacing: '0.12em', color: 'var(--slate)', marginBottom: 20,
  };

  return (
    <div className="view active">
      <Topbar crumb={workspace?.name ?? 'Workspace'} title="Plans & Billing" onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 24px 80px', maxWidth: 900, margin: '0 auto' }}>

        {verifyState === 'verifying' && (
          <div style={{ background: 'var(--indigo-tint)', border: '1px solid var(--indigo-tint2)', borderRadius: 'var(--r)', padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: 'var(--indigo-600)', fontWeight: 500 }}>
            Verifying payment…
          </div>
        )}
        {verifyState === 'error' && (
          <div style={{ background: 'var(--amber-tint)', border: '1px solid oklch(0.85 0.06 75)', borderRadius: 'var(--r)', padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: 'var(--ink-2)' }}>
            Payment received but plan verification failed — please refresh the page or contact support.
          </div>
        )}
        {successMsg && verifyState !== 'verifying' && (
          <div style={{ background: 'var(--green-tint, #f0fdf4)', border: '1px solid #86efac', borderRadius: 'var(--r)', padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: '#15803d', fontWeight: 500 }}>
            {successMsg}
          </div>
        )}
        {cancelMsg && (
          <div style={{ background: 'var(--amber-tint)', border: '1px solid oklch(0.85 0.06 75)', borderRadius: 'var(--r)', padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: 'var(--ink-2)' }}>
            {cancelMsg}
          </div>
        )}
        {billingError && (
          <div style={{ background: 'var(--red-tint)', border: '1px solid #fca5a5', borderRadius: 'var(--r)', padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: 'var(--red)' }}>
            {billingError}
          </div>
        )}

        {/* Current plan status */}
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: '22px 24px', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Your plan</h2>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                  padding: '2px 10px', borderRadius: 20,
                  background: currentPlan === 'pro' ? 'var(--indigo-tint2)' : 'var(--line)',
                  color: currentPlan === 'pro' ? 'var(--indigo-600)' : 'var(--slate)',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  {currentPlanDef.name}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--slate)' }}>
                {currentPlan === 'free'
                  ? 'Free plan · no credit card on file'
                  : `Billed monthly · next invoice on Jul 10, 2026`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {isOnFree && (
                <div style={{ background: 'var(--indigo-tint)', border: '1px solid var(--indigo-tint2)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 13 }}>
                  <strong style={{ color: 'var(--indigo-600)' }}>14-day Pro trial available</strong>
                  <span style={{ color: 'var(--slate)', marginLeft: 6 }}>No credit card needed.</span>
                </div>
              )}
              {!isOnFree && currentPlan !== 'enterprise' && (
                <button
                  onClick={handleManage}
                  disabled={billingLoading}
                  style={{ padding: '8px 16px', borderRadius: 'var(--r)', border: '1px solid var(--line)', background: 'var(--paper)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', opacity: billingLoading ? 0.6 : 1 }}
                >
                  {billingLoading ? 'Loading…' : 'Manage subscription →'}
                </button>
              )}
            </div>
          </div>

          <UsageBar label="Contacts" used={usageData.contacts.used} limit={usageData.contacts.limit} />
          <UsageBar label="Send rate · this hour" used={usageData.sendRate.used} limit={usageData.sendRate.limit} />

          {isOnFree && usageData.sendRate.used / usageData.sendRate.limit >= 0.8 && (
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              background: 'var(--amber-tint)', border: '1px solid oklch(0.85 0.06 75)',
              borderRadius: 'var(--r)', padding: '10px 14px', marginTop: 4, fontSize: 13,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span style={{ color: 'var(--ink-2)' }}>
                You're at <strong>{Math.round((usageData.sendRate.used / usageData.sendRate.limit) * 100)}% of your hourly send limit.</strong>{' '}
                Upgrade to Pro for 20× more throughput.
              </span>
            </div>
          )}
        </div>

        {/* Plan cards */}
        <div style={sectionHead}>Choose a plan</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 48 }}>
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isPro = plan.id === 'pro';

            return (
              <div
                key={plan.id}
                style={{
                  background: isPro ? 'var(--ink)' : 'var(--paper)',
                  border: `1.5px solid ${isCurrent && !isPro ? 'var(--indigo)' : isPro ? 'transparent' : 'var(--line)'}`,
                  borderRadius: 'var(--r-lg)',
                  padding: '24px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  color: isPro ? 'oklch(0.92 0.01 265)' : 'var(--ink)',
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: -1, right: 18,
                    background: 'linear-gradient(135deg, var(--indigo), var(--coral))',
                    color: '#fff', fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--mono)',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '4px 12px', borderRadius: '0 0 var(--r-sm) var(--r-sm)',
                  }}>
                    Most popular
                  </div>
                )}

                {isCurrent && !isPro && (
                  <div style={{
                    position: 'absolute', top: 12, right: 14,
                    fontSize: 10.5, fontFamily: 'var(--mono)', fontWeight: 600,
                    color: 'var(--indigo-600)', background: 'var(--indigo-tint2)',
                    padding: '2px 8px', borderRadius: 20,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    Current
                  </div>
                )}

                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: isPro ? 'var(--coral)' : 'var(--slate)', marginBottom: 10 }}>
                  {plan.name}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: isPro ? '#fff' : 'var(--ink)' }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ fontSize: 13, color: isPro ? 'oklch(0.65 0.02 265)' : 'var(--slate)' }}>{plan.period}</span>
                  )}
                </div>

                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: isPro ? 'var(--coral)' : 'var(--indigo)', marginBottom: 6 }}>
                  {plan.highlight}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: isPro ? 'oklch(0.55 0.02 265)' : 'var(--slate)', marginBottom: 20 }}>
                  {plan.contacts} · {plan.workspaces}
                </div>

                <div style={{ flex: 1, marginBottom: 22 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 9, color: isPro ? 'oklch(0.82 0.01 265)' : 'var(--ink-2)' }}>
                      <CheckIcon color={isPro ? 'var(--coral)' : 'var(--green)'} />
                      {f}
                    </div>
                  ))}
                  {plan.locked.map((f) => (
                    <div key={f} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 9, color: 'var(--faint)' }}>
                      <LockIcon />
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  disabled={isCurrent || billingLoading}
                  onClick={() => {
                    if (isCurrent) return;
                    if (plan.id === 'pro') handleUpgrade();
                    else if (plan.id === 'enterprise') window.location.href = 'mailto:sales@bulksend.io';
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: 'var(--r)',
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: isCurrent || billingLoading ? 'default' : 'pointer',
                    border: 'none',
                    transition: 'background 0.15s, opacity 0.15s',
                    opacity: billingLoading && plan.id === 'pro' ? 0.6 : 1,
                    ...(isCurrent
                      ? { background: 'var(--line)', color: 'var(--slate)' }
                      : isPro
                      ? { background: 'linear-gradient(135deg, var(--indigo), var(--coral))', color: '#fff', boxShadow: '0 4px 14px oklch(0.5 0.15 310/.35)' }
                      : { background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink-2)' }),
                  }}
                  onMouseEnter={e => { if (!isCurrent && !billingLoading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = billingLoading && plan.id === 'pro' ? '0.6' : '1'; }}
                >
                  {isCurrent ? 'Current plan' : billingLoading && plan.id === 'pro' ? 'Loading…' : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature comparison */}
        <div style={sectionHead}>What's included</div>
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 40 }}>
          {[
            { feature: 'Monthly send rate', free: '100 / hour', pro: '2,000 / hour', ent: 'Custom' },
            { feature: 'Contacts', free: '5,000', pro: '100,000', ent: 'Unlimited' },
            { feature: 'Workspaces', free: '1', pro: 'Unlimited', ent: 'Unlimited' },
            { feature: 'Analytics', free: 'Basic', pro: 'Full suite', ent: 'Full suite' },
            { feature: 'Custom sending domains', free: false, pro: true, ent: true },
            { feature: 'A/B testing', free: false, pro: true, ent: true },
            { feature: 'Priority support', free: false, pro: true, ent: true },
            { feature: 'SSO / SAML', free: false, pro: false, ent: true },
            { feature: 'Dedicated infrastructure', free: false, pro: false, ent: true },
            { feature: 'SLA guarantee', free: false, pro: false, ent: true },
          ].map((row, i) => (
            <div
              key={row.feature}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                borderTop: i > 0 ? '1px solid var(--line-2)' : 'none',
                padding: '12px 20px', alignItems: 'center',
                background: i % 2 === 0 ? 'transparent' : 'var(--bg)',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{row.feature}</span>
              {(['free', 'pro', 'ent'] as const).map(tier => {
                const val = row[tier];
                return (
                  <span key={tier} style={{ fontSize: 13, fontFamily: typeof val === 'string' ? 'var(--mono)' : undefined, textAlign: 'center' }}>
                    {typeof val === 'boolean' ? (
                      val
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto' }}><path d="M20 6L9 17l-5-5"/></svg>
                        : <span style={{ color: 'var(--line)', fontSize: 18, display: 'block', textAlign: 'center', lineHeight: 1 }}>—</span>
                    ) : (
                      <span style={{ color: tier === 'pro' ? 'var(--indigo-600)' : 'var(--ink-2)' }}>{val}</span>
                    )}
                  </span>
                );
              })}
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '4px 20px 4px', borderTop: '1px solid var(--line-2)', background: 'var(--bg)' }}>
            <span />
            {(['Free', 'Pro', 'Enterprise'] as const).map(label => (
              <span key={label} style={{ fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: label === 'Pro' ? 'var(--indigo-600)' : 'var(--slate)', textAlign: 'center', padding: '8px 0 4px' }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={sectionHead}>Common questions</div>
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 32 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderTop: i > 0 ? '1px solid var(--line-2)' : 'none' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '16px 20px', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, color: 'var(--ink)',
                  transition: 'background 0.13s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
              >
                {faq.q}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--slate)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'none' }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 20px 16px', fontSize: 13.5, color: 'var(--slate)', lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--slate)' }}>
          Questions? Email us at{' '}
          <a href="mailto:billing@bulksend.io" style={{ color: 'var(--indigo)', fontWeight: 500 }}>billing@bulksend.io</a>
          {' '}or{' '}
          <a href="mailto:sales@bulksend.io" style={{ color: 'var(--indigo)', fontWeight: 500 }}>talk to sales</a>.
        </div>

      </div>
    </div>
  );
}
