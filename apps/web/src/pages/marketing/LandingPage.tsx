import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/site.css';

const CHART_HEIGHTS = [35, 52, 41, 65, 78, 58, 44, 90, 72, 55, 61, 82];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      {/* NAV */}
      <header className={`nav${scrolled ? ' scrolled' : ''}`} id="nav">
        <div className="container nav-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 12l19-9-9 19-2-8-8-2z" fill="#fff"/></svg>
            </span>
            BulkSend
          </Link>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#pipeline">How it works</a>
            <a href="#infra">Platform</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="nav-cta">
            <Link to="/login" className="signin">Sign in</Link>
            <Link to="/signup" className="btn btn-primary">Start free</Link>
          </div>
          <button className="nav-toggle" onClick={() => setMenuOpen(m => !m)} aria-label="Toggle menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen
                ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>
                : <><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></>}
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu open">
          {['#features', '#pipeline', '#infra', '#pricing'].map((href, i) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>
              {['Features', 'How it works', 'Platform', 'Pricing'][i]}
            </a>
          ))}
          <div className="mm-cta">
            <Link to="/login" className="btn btn-ghost">Sign in</Link>
            <Link to="/signup" className="btn btn-primary">Start free</Link>
          </div>
        </div>
      )}

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="container">
            <div className="hero-grid">
              <div className="hero-copy">
                <span className="eyebrow">Email infrastructure</span>
                <h1 className="h-display">Campaigns that<br /><span className="accent">actually scale.</span></h1>
                <p className="hero-sub lede">Upload millions of contacts, hit send, and let the async engine fan out, throttle, and track every message — without melting your workers.</p>
                <div className="hero-actions">
                  <Link to="/signup" className="btn btn-coral btn-lg btn-arrow">
                    Start for free
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                  <a href="#pipeline" className="btn btn-dark-ghost btn-lg">See how it works</a>
                </div>
                <div className="hero-meta">
                  {[
                    '2B+ emails delivered',
                    '99.9% uptime SLA',
                    'SOC 2 Type II',
                  ].map(m => (
                    <span key={m} className="mi">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dashboard mockup */}
              <div className="mock">
                <div className="mock-bar">
                  <span className="dots"><i/><i/><i/></span>
                  <span className="addr">app.bulksend.io/campaigns/spring-launch</span>
                </div>
                <div className="mock-body">
                  <div className="mock-head">
                    <div><div className="ct">Spring Launch 2026</div><div className="cs">Active subscribers · 48,210 recipients</div></div>
                    <div className="mock-status"><span className="pulse"/> Sending</div>
                  </div>
                  <div className="mock-stats">
                    {[
                      { v: '35,100', l: 'Sent', cls: '' },
                      { v: '61.2%', l: 'Open rate', cls: 'accent2' },
                      { v: '18.4%', l: 'Click rate', cls: 'accent' },
                      { v: '0.9%', l: 'Bounce', cls: '' },
                    ].map(s => (
                      <div key={s.l} className={`mstat${s.cls ? ` ${s.cls}` : ''}`}>
                        <div className="mv">{s.v}</div>
                        <div className="ml">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mock-progress">
                    <div className="pl"><span>Progress</span><span>35,100 / 48,210 · 73%</span></div>
                    <div className="track"><div className="fill"/></div>
                  </div>
                  <div className="mock-chart">
                    {CHART_HEIGHTS.map((h, i) => (
                      <div key={i} className="bar" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <div className="strip section-sm">
          <div className="container strip-inner">
            {[
              { v: '2B+', l: 'Emails delivered' },
              { v: '99.9%', l: 'Uptime SLA' },
              { v: '<200ms', l: 'API p99 latency' },
              { v: '10M+', l: 'Contacts managed' },
            ].map(s => (
              <div key={s.l} className="si">
                <div className="v">{s.v.includes('+') ? <>{s.v.replace('+', '')}<span className="accent">+</span></> : s.v}</div>
                <div className="l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <section className="section" id="features">
          <div className="container">
            <div className="section-head center">
              <span className="eyebrow center">Features</span>
              <h2 className="h-section">Everything your team needs to send at scale</h2>
              <p className="lede">From CSV import to real-time delivery analytics — the full campaign stack, without the infrastructure headache.</p>
            </div>
            <div className="feat-grid">
              {[
                { icon: 'users', title: 'Multi-tenant workspaces', desc: 'Isolated data, per-workspace rate limits, and role-based access. Invite your team and spin up new workspaces in seconds.', tag: 'workspace isolation', cls: '' },
                { icon: 'upload', title: 'Contact management', desc: 'CSV upload, custom attributes, tagging, and dynamic segments. Build audiences with filter rules — counts update live.', tag: 'csv · segments · tags', cls: 'c2' },
                { icon: 'calendar', title: 'Campaign scheduling', desc: "Compose once, send now or schedule for later. Set it and forget it — the scheduler picks it up exactly on time.", tag: 'cron scheduling', cls: '' },
                { icon: 'send', title: 'Async sending engine', desc: 'One click fans out to millions via Kafka workers, throttled by Redis token bucket. No request timeouts, no melted servers.', tag: 'kafka · redis', cls: 'c3' },
                { icon: 'chart', title: 'Real-time event tracking', desc: 'Open pixel, click redirect, bounce handler, and unsubscribe landing — every event stored and queryable.', tag: 'opens · clicks · bounces', cls: '' },
                { icon: 'lock', title: 'Rate limiting & compliance', desc: 'Per-workspace hourly caps, SendGrid integration, and automatic unsubscribe suppression. Stay compliant by default.', tag: 'CAN-SPAM · GDPR ready', cls: 'c2' },
              ].map(f => (
                <div key={f.title} className={`feat${f.cls ? ` ${f.cls}` : ''}`}>
                  <div className="feat-ico">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      {f.icon === 'users' && <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13A4 4 0 0119 7"/></>}
                      {f.icon === 'upload' && <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>}
                      {f.icon === 'calendar' && <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>}
                      {f.icon === 'send' && <><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></>}
                      {f.icon === 'chart' && <><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></>}
                      {f.icon === 'lock' && <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>}
                    </svg>
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <span className="feat-tag">{f.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="section" id="pricing">
          <div className="container">
            <div className="section-head center">
              <span className="eyebrow center">Pricing</span>
              <h2 className="h-section">Simple, usage-based pricing</h2>
              <p className="lede">Start free, scale when you need to. Hourly rate limits — not per-email charges that add up.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 900, margin: '0 auto' }}>
              {[
                { name: 'Free', price: '$0', period: '/month', rate: '100 emails/hour', features: ['1 workspace', '5,000 contacts', 'Basic analytics', 'SendGrid integration'], featured: false, cta: 'Get started free' },
                { name: 'Pro', price: '$49', period: '/month', rate: '2,000 emails/hour', features: ['Unlimited workspaces', '100,000 contacts', 'Full analytics suite', 'Priority support', 'Custom sending domains'], featured: true, cta: 'Start Pro trial' },
                { name: 'Enterprise', price: 'Custom', period: '', rate: 'Custom rate limits', features: ['Unlimited everything', 'Dedicated infrastructure', 'SLA guarantee', 'SSO / SAML', 'Dedicated CSM'], featured: false, cta: 'Contact sales' },
              ].map(plan => (
                <div key={plan.name} style={{
                  background: plan.featured ? 'var(--dark)' : 'var(--paper)',
                  border: `1px solid ${plan.featured ? 'var(--dark-line)' : 'var(--line)'}`,
                  borderRadius: 'var(--r-xl)',
                  padding: 28,
                  color: plan.featured ? 'var(--dark-fg)' : 'var(--ink)',
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: plan.featured ? 'var(--indigo-300)' : 'var(--slate-3)', marginBottom: 12 }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 36, letterSpacing: '-0.03em' }}>{plan.price}</span>
                    {plan.period && <span style={{ color: plan.featured ? 'var(--dark-soft)' : 'var(--slate)', fontSize: 14 }}>{plan.period}</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: plan.featured ? 'var(--indigo-300)' : 'var(--indigo)', marginBottom: 20 }}>{plan.rate}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 9, fontSize: 14, color: plan.featured ? 'var(--dark-soft)' : 'var(--ink-2)' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, color: plan.featured ? 'var(--coral)' : 'var(--green)', marginTop: 2 }}><path d="M20 6L9 17l-5-5"/></svg>
                        {f}
                      </div>
                    ))}
                  </div>
                  <Link to="/signup" className={`btn${plan.featured ? ' btn-coral' : ' btn-ghost'}`} style={{ width: '100%' }}>{plan.cta}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section" style={{ background: 'var(--dark)', color: 'var(--dark-fg)' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <span className="eyebrow center" style={{ color: 'var(--indigo-300)' }}>Get started today</span>
            <h2 className="h-section" style={{ color: '#fff', marginTop: 16 }}>Ready to scale your email?</h2>
            <p className="lede" style={{ color: 'var(--dark-soft)', marginTop: 16, marginInline: 'auto', maxWidth: '46ch' }}>
              Join thousands of teams that send millions of emails reliably. Free plan, no credit card.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
              <Link to="/signup" className="btn btn-coral btn-lg">Start for free →</Link>
              <a href="mailto:sales@bulksend.io" className="btn btn-dark-ghost btn-lg">Talk to sales</a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: 'var(--dark)', borderTop: '1px solid var(--dark-line)', padding: '32px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <Link to="/" className="brand" style={{ color: '#fff' }}>
              <span className="brand-mark">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M2 12l19-9-9 19-2-8-8-2z" fill="#fff"/></svg>
              </span>
              BulkSend
            </Link>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--dark-soft)' }}>
              © 2026 BulkSend · Privacy · Terms
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
