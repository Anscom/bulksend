export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: {
    headerBg: string;
    headerAccent?: string;
    ctaColor: string;
    layout: 'hero' | 'digest' | 'promo' | 'event' | 'minimal' | 'steps' | 'two-col';
  };
  html: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // ── Blank ───────────────────────────────────────────────────────────────────
  {
    id: 'blank',
    name: 'Start blank',
    category: 'Basic',
    description: 'Build from scratch with the rich editor',
    thumbnail: { headerBg: '#f9fafb', ctaColor: '#6b7280', layout: 'minimal' },
    html: '',
  },

  // ── Welcome ─────────────────────────────────────────────────────────────────
  {
    id: 'welcome',
    name: 'Welcome email',
    category: 'Onboarding',
    description: 'Greet new subscribers with next steps',
    thumbnail: { headerBg: 'linear-gradient(135deg,#4f46e5,#7c3aed)', ctaColor: '#4f46e5', layout: 'steps' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:44px 36px;border-radius:12px 12px 0 0;text-align:center">
    <div style="font-size:42px;margin-bottom:12px">👋</div>
    <h1 style="color:#fff;font-size:26px;font-weight:700;margin:0 0 10px;letter-spacing:-0.5px">Welcome to Acme, {{first_name}}!</h1>
    <p style="color:rgba(255,255,255,.8);font-size:15px;margin:0">Your account is live — here's how to get the most out of it.</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 28px">We're genuinely excited you're here. Thousands of teams use Acme to send smarter email — and you're about to join them.</p>

    <div style="margin-bottom:32px">
      <p style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin:0 0 16px">3 steps to your first campaign</p>

      <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:16px">
        <div style="min-width:34px;height:34px;border-radius:50%;background:#eef2ff;color:#4f46e5;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center">1</div>
        <div>
          <strong style="color:#111827;font-size:14px">Verify your sending domain</strong>
          <p style="color:#6b7280;font-size:13px;margin:4px 0 0;line-height:1.6">Add a DNS record so your emails land in the inbox, not spam.</p>
        </div>
      </div>

      <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:16px">
        <div style="min-width:34px;height:34px;border-radius:50%;background:#eef2ff;color:#4f46e5;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center">2</div>
        <div>
          <strong style="color:#111827;font-size:14px">Import your contacts</strong>
          <p style="color:#6b7280;font-size:13px;margin:4px 0 0;line-height:1.6">Upload a CSV or connect your CRM — your list syncs in seconds.</p>
        </div>
      </div>

      <div style="display:flex;gap:14px;align-items:flex-start">
        <div style="min-width:34px;height:34px;border-radius:50%;background:#eef2ff;color:#4f46e5;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center">3</div>
        <div>
          <strong style="color:#111827;font-size:14px">Send your first campaign</strong>
          <p style="color:#6b7280;font-size:13px;margin:4px 0 0;line-height:1.6">Pick a template, personalise it, and hit send — takes under 5 minutes.</p>
        </div>
      </div>
    </div>

    <div style="text-align:center;margin-bottom:32px">
      <a href="#" style="background:#4f46e5;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(79,70,229,.35)">Open my dashboard →</a>
    </div>

    <div style="background:#f9fafb;border-radius:8px;padding:18px 20px;font-size:13px;color:#6b7280;line-height:1.6">
      <strong style="color:#374151">Questions?</strong> Reply to this email — a real human replies within 2 hours. Or browse our <a href="#" style="color:#4f46e5;text-decoration:none;font-weight:500">help center</a>.
    </div>

    <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;text-align:center">You received this because you created an account at acme.co.<br><a href="#" style="color:#9ca3af">Unsubscribe</a></p>
  </div>
</div>`,
  },

  // ── Newsletter ───────────────────────────────────────────────────────────────
  {
    id: 'newsletter',
    name: 'Newsletter',
    category: 'Digest',
    description: 'Weekly or monthly newsletter with featured stories',
    thumbnail: { headerBg: '#111827', headerAccent: '#4f46e5', ctaColor: '#4f46e5', layout: 'digest' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:#111827;padding:20px 32px;border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:space-between">
    <div style="color:#fff;font-weight:700;font-size:17px;letter-spacing:-0.3px">📰 The Acme Digest</div>
    <div style="color:#6b7280;font-size:11px;font-family:monospace;letter-spacing:.03em">JUNE 2026 · NO. 42</div>
  </div>

  <div style="background:#4f46e5;padding:32px">
    <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:10px;font-family:monospace">This week</div>
    <h2 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 12px;line-height:1.35;letter-spacing:-0.3px">New analytics dashboard is live — your data has never looked this good 📈</h2>
    <p style="color:rgba(255,255,255,.8);font-size:14px;line-height:1.7;margin:0 0 20px">We rebuilt reporting from scratch. Cohort view, deliverability score, and real-time click maps — all in one place.</p>
    <a href="#" style="background:#fff;color:#4f46e5;padding:10px 22px;border-radius:6px;font-weight:600;font-size:13px;text-decoration:none;display:inline-block">Read the announcement →</a>
  </div>

  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:32px">
    <p style="font-size:15px;margin:0 0 6px">Hi {{first_name}},</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">Here's what's new at Acme this week — product updates, tips from our team, and a few things we think you'll find useful.</p>

    <div style="border-top:1px solid #f3f4f6;padding-top:24px;margin-bottom:24px">
      <p style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;font-family:monospace;margin:0 0 20px">In this issue</p>

      <div style="border-left:3px solid #4f46e5;padding-left:16px;margin-bottom:20px">
        <strong style="color:#111827;font-size:14px;display:block;margin-bottom:4px">🚀 Smart send-time optimisation</strong>
        <span style="color:#6b7280;font-size:13px;line-height:1.6">We now predict the best send time for each contact individually — zero config required.</span>
      </div>

      <div style="border-left:3px solid #e94560;padding-left:16px;margin-bottom:20px">
        <strong style="color:#111827;font-size:14px;display:block;margin-bottom:4px">📊 Tip: preview text is worth 5 minutes</strong>
        <span style="color:#6b7280;font-size:13px;line-height:1.6">Most senders ignore it. Here's why fixing it can lift open rates by 10% or more.</span>
      </div>

      <div style="border-left:3px solid #f59e0b;padding-left:16px">
        <strong style="color:#111827;font-size:14px;display:block;margin-bottom:4px">💡 "How do I A/B test subject lines?"</strong>
        <span style="color:#6b7280;font-size:13px;line-height:1.6">Our most-asked question this week — answered in 3 concrete steps.</span>
      </div>
    </div>

    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      Acme · 100 Market St, San Francisco, CA<br>
      <a href="#" style="color:#9ca3af">Manage preferences</a> · <a href="#" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</div>`,
  },

  // ── Product Launch ───────────────────────────────────────────────────────────
  {
    id: 'product-launch',
    name: 'Product launch',
    category: 'Announcement',
    description: 'Hero-style reveal for new features or products',
    thumbnail: { headerBg: 'linear-gradient(160deg,#0f172a,#1e1b4b)', headerAccent: '#818cf8', ctaColor: '#6366f1', layout: 'hero' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(160deg,#0f172a,#1e1b4b);padding:52px 36px;border-radius:12px 12px 0 0;text-align:center">
    <div style="display:inline-block;background:rgba(129,140,248,.15);border:1px solid rgba(129,140,248,.3);color:#a5b4fc;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:5px 14px;border-radius:20px;margin-bottom:20px;font-family:monospace">New release</div>
    <h1 style="color:#fff;font-size:30px;font-weight:800;margin:0 0 14px;letter-spacing:-1px;line-height:1.2">Introducing Campaigns v2</h1>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 28px;max-width:380px;margin-left:auto;margin-right:auto">Faster sending, real-time analytics, and AI-written subject lines — everything you've been asking for, all at once.</p>
    <a href="#" style="background:#6366f1;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;box-shadow:0 4px 20px rgba(99,102,241,.5)">See what's new →</a>
  </div>

  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 28px">Hi {{first_name}}, we've been building this one for months — and we're thrilled to finally share it with you.</p>

    <div style="display:grid;gap:0">
      <div style="display:flex;gap:16px;padding:18px 0;border-bottom:1px solid #f3f4f6;align-items:flex-start">
        <div style="font-size:28px;min-width:40px">⚡</div>
        <div>
          <strong style="color:#111827;font-size:14px;display:block;margin-bottom:4px">10× faster delivery engine</strong>
          <span style="color:#6b7280;font-size:13px;line-height:1.6">Rebuilt from scratch on our new infra. A 50k-contact campaign that took 3 hours now takes 18 minutes.</span>
        </div>
      </div>

      <div style="display:flex;gap:16px;padding:18px 0;border-bottom:1px solid #f3f4f6;align-items:flex-start">
        <div style="font-size:28px;min-width:40px">📊</div>
        <div>
          <strong style="color:#111827;font-size:14px;display:block;margin-bottom:4px">Live analytics dashboard</strong>
          <span style="color:#6b7280;font-size:13px;line-height:1.6">Watch opens, clicks, and bounces update in real time as your campaign sends. No more refreshing.</span>
        </div>
      </div>

      <div style="display:flex;gap:16px;padding:18px 0;align-items:flex-start">
        <div style="font-size:28px;min-width:40px">✨</div>
        <div>
          <strong style="color:#111827;font-size:14px;display:block;margin-bottom:4px">AI subject line suggestions</strong>
          <span style="color:#6b7280;font-size:13px;line-height:1.6">Get 5 subject line ideas based on your email content — ranked by predicted open rate.</span>
        </div>
      </div>
    </div>

    <div style="background:#f9fafb;border-radius:10px;padding:20px 24px;margin-top:28px;text-align:center">
      <p style="font-size:13px;color:#6b7280;margin:0 0 14px">Available now on all plans. <strong style="color:#374151">No action needed</strong> — your workspace was updated automatically.</p>
      <a href="#" style="background:#6366f1;color:#fff;text-decoration:none;padding:11px 28px;border-radius:7px;font-weight:600;font-size:14px;display:inline-block">Explore Campaigns v2 →</a>
    </div>

    <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;text-align:center"><a href="#" style="color:#9ca3af">Unsubscribe</a> · <a href="#" style="color:#9ca3af">View in browser</a></p>
  </div>
</div>`,
  },

  // ── Promotional ──────────────────────────────────────────────────────────────
  {
    id: 'promo',
    name: 'Promotional offer',
    category: 'Sales',
    description: 'Discount or sale announcement with a promo code',
    thumbnail: { headerBg: 'linear-gradient(135deg,#e94560,#f59e0b)', ctaColor: '#e94560', layout: 'promo' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#e94560,#f97316);padding:48px 36px;border-radius:12px 12px 0 0;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">🎉</div>
    <div style="color:rgba(255,255,255,.9);font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px;font-family:monospace">Limited time offer</div>
    <div style="color:#fff;font-size:72px;font-weight:800;line-height:1;letter-spacing:-2px;margin-bottom:8px">30%</div>
    <div style="color:rgba(255,255,255,.9);font-size:20px;font-weight:600;margin-bottom:20px">off all annual plans</div>
    <div style="display:inline-block;background:rgba(255,255,255,.2);border:2px dashed rgba(255,255,255,.6);border-radius:8px;padding:12px 28px;margin-bottom:20px">
      <div style="color:rgba(255,255,255,.8);font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;font-family:monospace">Use code at checkout</div>
      <div style="color:#fff;font-size:24px;font-weight:800;letter-spacing:.08em;font-family:monospace">SUMMER30</div>
    </div>
    <div style="color:rgba(255,255,255,.7);font-size:12px">Expires June 30, 2026 · New customers only</div>
  </div>

  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:15px;line-height:1.7;margin:0 0 20px">Hi {{first_name}},</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 24px">Summer's here, and so is our biggest sale of the year. For the next 72 hours, get 30% off any annual plan — lock in the lower rate and save hundreds.</p>

    <div style="background:#fff9f0;border:1px solid #fed7aa;border-radius:10px;padding:20px;margin-bottom:28px">
      <p style="font-size:13px;font-weight:600;color:#92400e;margin:0 0 12px">What's included:</p>
      <ul style="margin:0;padding-left:20px;color:#6b7280;font-size:13px;line-height:2">
        <li>Unlimited campaigns</li>
        <li>Up to 500,000 contacts</li>
        <li>Priority support &amp; onboarding</li>
        <li>Advanced segmentation + A/B testing</li>
      </ul>
    </div>

    <div style="text-align:center;margin-bottom:28px">
      <a href="#" style="background:linear-gradient(135deg,#e94560,#f97316);color:#fff;text-decoration:none;padding:16px 44px;border-radius:8px;font-weight:700;font-size:16px;display:inline-block;box-shadow:0 4px 16px rgba(233,69,96,.35)">Claim 30% off →</a>
      <div style="font-size:12px;color:#9ca3af;margin-top:10px">Code auto-applied at checkout</div>
    </div>

    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      You received this promotional email as an Acme subscriber.<br>
      <a href="#" style="color:#9ca3af">Unsubscribe from promotions</a>
    </p>
  </div>
</div>`,
  },

  // ── Re-engagement ────────────────────────────────────────────────────────────
  {
    id: 'reengagement',
    name: 'Re-engagement',
    category: 'Retention',
    description: 'Win back inactive subscribers with a personal touch',
    thumbnail: { headerBg: '#0f172a', headerAccent: '#34d399', ctaColor: '#10b981', layout: 'minimal' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:#0f172a;padding:40px 36px;border-radius:12px 12px 0 0;text-align:center">
    <div style="font-size:52px;margin-bottom:14px">💚</div>
    <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 10px;letter-spacing:-0.5px">We miss you, {{first_name}}</h1>
    <p style="color:#94a3b8;font-size:14px;margin:0">It's been a while — we wanted to check in.</p>
  </div>

  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:15px;line-height:1.7;margin:0 0 20px">A lot has changed since you last logged in, and we wanted to make sure you didn't miss any of it.</p>

    <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:28px">
      <p style="font-weight:600;color:#065f46;font-size:14px;margin:0 0 10px">What's new since you've been away:</p>
      <ul style="margin:0;padding-left:18px;color:#374151;font-size:13px;line-height:2">
        <li><strong>Smart segments</strong> — audiences that update automatically</li>
        <li><strong>Drag-and-drop editor</strong> — no HTML needed</li>
        <li><strong>Deliverability insights</strong> — know exactly why emails land where they do</li>
      </ul>
    </div>

    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">To say thanks for sticking around, here's an exclusive offer just for you:</p>

    <div style="background:linear-gradient(135deg,#065f46,#0f766e);border-radius:10px;padding:24px;text-align:center;margin-bottom:28px">
      <div style="color:rgba(255,255,255,.8);font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-family:monospace;margin-bottom:8px">Your personal discount</div>
      <div style="color:#fff;font-size:36px;font-weight:800;letter-spacing:-1px;margin-bottom:4px">20% off</div>
      <div style="color:rgba(255,255,255,.7);font-size:13px;margin-bottom:20px">next 3 months · no commitment</div>
      <a href="#" style="background:#fff;color:#065f46;text-decoration:none;padding:12px 30px;border-radius:7px;font-weight:700;font-size:14px;display:inline-block">Claim your discount →</a>
    </div>

    <div style="text-align:center;margin-bottom:24px">
      <p style="font-size:13px;color:#9ca3af;margin:0 0 12px">Not interested in coming back?</p>
      <a href="#" style="color:#9ca3af;font-size:13px;text-decoration:underline">Unsubscribe from all emails</a>
    </div>

    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">Acme · San Francisco, CA · <a href="#" style="color:#9ca3af">Privacy Policy</a></p>
  </div>
</div>`,
  },

  // ── Event Invite ─────────────────────────────────────────────────────────────
  {
    id: 'event',
    name: 'Event invitation',
    category: 'Events',
    description: 'Invite subscribers to a webinar, meetup, or launch',
    thumbnail: { headerBg: 'linear-gradient(135deg,#1e40af,#7c3aed)', ctaColor: '#3b82f6', layout: 'event' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:44px 36px;border-radius:12px 12px 0 0;text-align:center">
    <div style="display:inline-block;background:rgba(255,255,255,.15);color:#fff;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:5px 14px;border-radius:20px;margin-bottom:20px;font-family:monospace">You're invited</div>
    <div style="font-size:40px;margin-bottom:14px">🎤</div>
    <h1 style="color:#fff;font-size:26px;font-weight:700;margin:0 0 12px;letter-spacing:-0.5px;line-height:1.3">Scaling Email Deliverability<br>in 2026</h1>
    <p style="color:rgba(255,255,255,.8);font-size:14px;margin:0">A live webinar with our Head of Deliverability</p>
  </div>

  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <div style="display:flex;gap:0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px">
      <div style="flex:1;padding:18px 20px;border-right:1px solid #e5e7eb;text-align:center">
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;font-family:monospace">Date</div>
        <div style="font-size:22px;font-weight:700;color:#111827;line-height:1">June 19</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">Thursday, 2026</div>
      </div>
      <div style="flex:1;padding:18px 20px;border-right:1px solid #e5e7eb;text-align:center">
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;font-family:monospace">Time</div>
        <div style="font-size:22px;font-weight:700;color:#111827;line-height:1">11 AM</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">Pacific / 2 PM ET</div>
      </div>
      <div style="flex:1;padding:18px 20px;text-align:center">
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;font-family:monospace">Where</div>
        <div style="font-size:22px;font-weight:700;color:#111827;line-height:1">🌐</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">Live &amp; Online</div>
      </div>
    </div>

    <p style="font-size:15px;line-height:1.7;margin:0 0 20px">Hi {{first_name}},</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 24px">Join us for a free 60-minute session where we'll cover the exact steps our top customers use to consistently hit 98%+ delivery rates — including DMARC setup, list hygiene, and suppression strategy.</p>

    <div style="margin-bottom:28px">
      <p style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin:0 0 14px">You'll walk away knowing how to:</p>
      <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2.2">
        <li>Set up SPF, DKIM, and DMARC correctly (in under 30 min)</li>
        <li>Identify and remove contacts that hurt your sender reputation</li>
        <li>Read bounce codes and fix the underlying issues</li>
        <li>Use Acme's deliverability score to prevent problems before they happen</li>
      </ul>
    </div>

    <div style="text-align:center;margin-bottom:28px">
      <a href="#" style="background:linear-gradient(135deg,#1e40af,#7c3aed);color:#fff;text-decoration:none;padding:15px 44px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 16px rgba(99,102,241,.35)">Reserve my spot →</a>
      <div style="font-size:12px;color:#9ca3af;margin-top:10px">Free · 60 min · Recording available after</div>
    </div>

    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      <a href="#" style="color:#9ca3af">Add to calendar</a> · <a href="#" style="color:#9ca3af">Can't make it? Sign up for the recording</a><br>
      <a href="#" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</div>`,
  },

  // ── Abandoned Cart ───────────────────────────────────────────────────────────
  {
    id: 'abandoned-cart',
    name: 'Abandoned cart',
    category: 'Sales',
    description: 'Recover shoppers who left items behind with a time-limited nudge',
    thumbnail: { headerBg: 'linear-gradient(135deg,#1e40af,#0ea5e9)', ctaColor: '#0ea5e9', layout: 'hero' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#1e40af,#0ea5e9);padding:44px 36px;border-radius:12px 12px 0 0;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">🛒</div>
    <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 10px;letter-spacing:-0.5px">You left something behind, {{first_name}}</h1>
    <p style="color:rgba(255,255,255,.8);font-size:14px;margin:0">Your cart is saved and ready whenever you are.</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:15px;line-height:1.7;margin:0 0 24px">Hi {{first_name}},</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">We noticed you left some items in your cart — they're still waiting for you. We've held your spot, but we can't keep it much longer.</p>
    <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px">
      <div style="padding:14px 20px;background:#f9fafb;border-bottom:1px solid #e5e7eb">
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;font-family:monospace">Your cart</div>
      </div>
      <div style="padding:20px">
        <div style="display:flex;align-items:center;gap:16px;padding-bottom:16px;border-bottom:1px solid #f3f4f6">
          <div style="width:60px;height:60px;border-radius:8px;background:#eff6ff;display:flex;align-items:center;justify-content:center;font-size:26px;flex:none">📦</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:14px;color:#111827">Pro Plan — Annual</div>
            <div style="font-size:13px;color:#6b7280;margin-top:2px">Up to 100,000 contacts · Priority support</div>
          </div>
          <div style="font-family:monospace;font-weight:700;font-size:16px;color:#111827">$299</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px">
          <span style="font-size:13px;color:#6b7280">Total (billed annually)</span>
          <span style="font-family:monospace;font-weight:700;font-size:17px;color:#111827">$299<span style="font-size:12px;color:#9ca3af;font-weight:400"> /yr</span></span>
        </div>
      </div>
    </div>
    <div style="background:#eff6ff;border-radius:8px;padding:14px 18px;margin-bottom:26px;display:flex;align-items:flex-start;gap:12px">
      <span style="font-size:18px;flex:none">💡</span>
      <p style="font-size:13px;color:#1e40af;margin:0;line-height:1.6">Use code <strong style="font-family:monospace;background:#dbeafe;padding:2px 6px;border-radius:4px">COMEBACK10</strong> for an extra 10% off — valid for the next 24 hours only.</p>
    </div>
    <div style="text-align:center;margin-bottom:28px">
      <a href="#" style="background:linear-gradient(135deg,#1e40af,#0ea5e9);color:#fff;text-decoration:none;padding:15px 44px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 16px rgba(14,165,233,.35)">Complete my purchase →</a>
      <div style="font-size:12px;color:#9ca3af;margin-top:10px">Secure checkout · Cancel anytime</div>
    </div>
    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      Questions? <a href="#" style="color:#0ea5e9;text-decoration:none">Chat with us</a> or reply to this email.<br>
      <a href="#" style="color:#9ca3af">Unsubscribe from cart reminders</a>
    </p>
  </div>
</div>`,
  },

  // ── Monthly Report ───────────────────────────────────────────────────────────
  {
    id: 'monthly-report',
    name: 'Monthly report',
    category: 'Digest',
    description: 'Automated monthly metrics and performance summary',
    thumbnail: { headerBg: 'linear-gradient(160deg,#0f172a,#1e293b)', ctaColor: '#6366f1', layout: 'digest' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(160deg,#0f172a,#1e293b);padding:28px 32px;border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:space-between;gap:16px">
    <div>
      <div style="color:rgba(255,255,255,.45);font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-family:monospace;margin-bottom:6px">Acme Monthly</div>
      <div style="color:#fff;font-weight:700;font-size:20px;letter-spacing:-0.4px">May 2026 Report</div>
    </div>
    <div style="background:rgba(99,102,241,.2);border:1px solid rgba(99,102,241,.4);border-radius:8px;padding:10px 16px;text-align:center;flex:none">
      <div style="color:#818cf8;font-size:10px;font-family:monospace;letter-spacing:.08em;margin-bottom:4px">MRR</div>
      <div style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px">$48.2k</div>
    </div>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">Hi {{first_name}}, here's your monthly snapshot for the workspace <strong style="color:#374151">{{workspace_name}}</strong>. May was a strong month — here's what drove it.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px">
      <div style="background:#f9fafb;border-radius:8px;padding:16px;text-align:center;border:1px solid #f3f4f6">
        <div style="font-size:24px;font-weight:800;color:#111827;letter-spacing:-1px">61%</div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px">Avg open rate</div>
        <div style="font-size:11px;color:#10b981;font-weight:600;margin-top:3px">↑ 4.2%</div>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;text-align:center;border:1px solid #f3f4f6">
        <div style="font-size:24px;font-weight:800;color:#111827;letter-spacing:-1px">18%</div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px">Click rate</div>
        <div style="font-size:11px;color:#10b981;font-weight:600;margin-top:3px">↑ 2.1%</div>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;text-align:center;border:1px solid #f3f4f6">
        <div style="font-size:24px;font-weight:800;color:#111827;letter-spacing:-1px">99.1%</div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px">Deliverability</div>
        <div style="font-size:11px;color:#6b7280;font-weight:600;margin-top:3px">— stable</div>
      </div>
    </div>
    <div style="margin-bottom:28px">
      <p style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;font-family:monospace;margin:0 0 14px">Top campaigns this month</p>
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f3f4f6">
        <span style="font-size:13px;font-weight:600;color:#111827;flex:1">Onboarding Drip 3/5</span>
        <span style="font-family:monospace;font-size:12px;color:#10b981;font-weight:600">72% open</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f3f4f6">
        <span style="font-size:13px;font-weight:600;color:#111827;flex:1">Product Update — v4.2</span>
        <span style="font-family:monospace;font-size:12px;color:#10b981;font-weight:600">67% open</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0">
        <span style="font-size:13px;font-weight:600;color:#111827;flex:1">Spring Launch 2026</span>
        <span style="font-family:monospace;font-size:12px;color:#3b82f6;font-weight:600">61% open</span>
      </div>
    </div>
    <div style="background:#fafafa;border-radius:10px;padding:18px 20px;margin-bottom:26px;border:1px solid #f3f4f6">
      <p style="font-size:13px;font-weight:600;color:#111827;margin:0 0 8px">💡 Insight for June</p>
      <p style="font-size:13px;color:#6b7280;line-height:1.65;margin:0">Your Tuesday 10 AM sends consistently outperform other slots by 12%. Consider scheduling your next newsletter for Tuesday morning.</p>
    </div>
    <div style="text-align:center;margin-bottom:28px">
      <a href="#" style="background:#0f172a;color:#fff;text-decoration:none;padding:12px 30px;border-radius:8px;font-weight:600;font-size:14px;display:inline-block">View full report →</a>
    </div>
    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      Acme · Monthly digest for <strong>{{workspace_name}}</strong><br>
      <a href="#" style="color:#9ca3af">Manage notifications</a> · <a href="#" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</div>`,
  },

  // ── Feedback Survey ──────────────────────────────────────────────────────────
  {
    id: 'feedback-survey',
    name: 'Feedback survey',
    category: 'Retention',
    description: 'NPS-style survey that takes 2 minutes and drives real insights',
    thumbnail: { headerBg: 'linear-gradient(135deg,#7c3aed,#a855f7)', ctaColor: '#8b5cf6', layout: 'minimal' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:44px 36px;border-radius:12px 12px 0 0;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">💬</div>
    <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 10px;letter-spacing:-0.5px">How are we doing, {{first_name}}?</h1>
    <p style="color:rgba(255,255,255,.8);font-size:14px;margin:0">2 minutes · real humans read every response</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:15px;line-height:1.7;margin:0 0 20px">Hi {{first_name}},</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">You've been with us for a while, and your experience shapes what we build next. We'd love to hear from you — it takes about 2 minutes.</p>
    <div style="background:#faf5ff;border:1px solid #ede9fe;border-radius:12px;padding:24px;margin-bottom:28px">
      <p style="font-size:13px;font-weight:600;color:#6d28d9;margin:0 0 16px;text-align:center">How likely are you to recommend Acme to a colleague?</p>
      <div style="display:flex;gap:4px;justify-content:center;margin-bottom:10px">
        <a href="#" style="width:36px;height:36px;border-radius:7px;background:#ede9fe;color:#7c3aed;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:13px">0</a>
        <a href="#" style="width:36px;height:36px;border-radius:7px;background:#ede9fe;color:#7c3aed;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:13px">1</a>
        <a href="#" style="width:36px;height:36px;border-radius:7px;background:#ede9fe;color:#7c3aed;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:13px">2</a>
        <a href="#" style="width:36px;height:36px;border-radius:7px;background:#ede9fe;color:#7c3aed;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:13px">3</a>
        <a href="#" style="width:36px;height:36px;border-radius:7px;background:#ede9fe;color:#7c3aed;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:13px">4</a>
        <a href="#" style="width:36px;height:36px;border-radius:7px;background:#ede9fe;color:#7c3aed;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:13px">5</a>
        <a href="#" style="width:36px;height:36px;border-radius:7px;background:#ede9fe;color:#7c3aed;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:13px">6</a>
        <a href="#" style="width:36px;height:36px;border-radius:7px;background:#ede9fe;color:#7c3aed;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:13px">7</a>
        <a href="#" style="width:36px;height:36px;border-radius:7px;background:#ddd6fe;color:#6d28d9;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:13px">8</a>
        <a href="#" style="width:36px;height:36px;border-radius:7px;background:#c4b5fd;color:#5b21b6;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-weight:600;font-size:13px">9</a>
        <a href="#" style="width:36px;height:36px;border-radius:7px;background:#8b5cf6;color:#fff;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px">10</a>
      </div>
      <div style="display:flex;justify-content:space-between;padding:0 4px">
        <span style="font-size:11px;color:#9ca3af">Not likely</span>
        <span style="font-size:11px;color:#9ca3af">Very likely</span>
      </div>
    </div>
    <div style="margin-bottom:28px">
      <p style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;font-family:monospace;margin:0 0 12px">Or answer one quick question:</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <a href="#" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border:1.5px solid #ede9fe;border-radius:8px;text-decoration:none;color:#374151;transition:background .15s">
          <span style="font-size:18px">🚀</span><span style="font-size:14px;font-weight:500">I'm getting great results — I just want more features</span>
        </a>
        <a href="#" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border:1.5px solid #ede9fe;border-radius:8px;text-decoration:none;color:#374151">
          <span style="font-size:18px">🤔</span><span style="font-size:14px;font-weight:500">I'm not sure how to get the most out of it</span>
        </a>
        <a href="#" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border:1.5px solid #ede9fe;border-radius:8px;text-decoration:none;color:#374151">
          <span style="font-size:18px">💬</span><span style="font-size:14px;font-weight:500">I have specific feedback I'd like to share</span>
        </a>
      </div>
    </div>
    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      This survey is entirely optional. <a href="#" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</div>`,
  },

  // ── Holiday Sale ─────────────────────────────────────────────────────────────
  {
    id: 'holiday-sale',
    name: 'Holiday sale',
    category: 'Sales',
    description: 'Seasonal sales event with urgency and bold discount',
    thumbnail: { headerBg: 'linear-gradient(135deg,#1c1c1e,#1e1b4b)', ctaColor: '#f59e0b', layout: 'promo' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#1c1c1e,#1e1b4b);padding:52px 36px;border-radius:12px 12px 0 0;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">✨</div>
    <div style="display:inline-block;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.4);color:#fbbf24;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:5px 14px;border-radius:20px;margin-bottom:18px;font-family:monospace">Black Friday · 72 hours only</div>
    <div style="color:#fff;font-size:80px;font-weight:900;line-height:1;letter-spacing:-3px;margin-bottom:6px">50%</div>
    <div style="color:rgba(255,255,255,.8);font-size:20px;font-weight:600;margin-bottom:18px">off everything</div>
    <div style="display:inline-block;background:rgba(245,158,11,.2);border:2px dashed rgba(245,158,11,.6);border-radius:8px;padding:12px 28px">
      <div style="color:rgba(255,255,255,.6);font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;font-family:monospace">Code at checkout</div>
      <div style="color:#fbbf24;font-size:26px;font-weight:900;letter-spacing:.1em;font-family:monospace">BLACK50</div>
    </div>
    <div style="color:rgba(255,255,255,.5);font-size:12px;margin-top:16px">Expires Nov 29, 2026 at midnight</div>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:15px;line-height:1.7;margin:0 0 20px">Hi {{first_name}},</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 26px">It's our biggest sale of the year — 50% off every plan for 72 hours. Lock in the price now and save hundreds on your annual plan.</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:20px;margin-bottom:26px">
      <p style="font-size:13px;font-weight:600;color:#92400e;margin:0 0 14px">Everything is included:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151">✓ <span>Unlimited campaigns</span></div>
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151">✓ <span>500k contacts</span></div>
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151">✓ <span>Advanced analytics</span></div>
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151">✓ <span>A/B testing</span></div>
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151">✓ <span>Priority support</span></div>
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151">✓ <span>API access</span></div>
      </div>
    </div>
    <div style="text-align:center;margin-bottom:28px">
      <a href="#" style="background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;text-decoration:none;padding:16px 50px;border-radius:8px;font-weight:800;font-size:16px;display:inline-block;box-shadow:0 4px 20px rgba(245,158,11,.4)">Claim 50% off →</a>
      <div style="font-size:12px;color:#9ca3af;margin-top:10px">Code auto-applied · No credit card to upgrade</div>
    </div>
    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      You received this promotional email as an Acme subscriber.<br>
      <a href="#" style="color:#9ca3af">Unsubscribe from promotions</a>
    </p>
  </div>
</div>`,
  },

  // ── Blog / Content Roundup ───────────────────────────────────────────────────
  {
    id: 'blog-digest',
    name: 'Blog roundup',
    category: 'Content',
    description: 'Curated reading list with article previews and category tags',
    thumbnail: { headerBg: 'linear-gradient(135deg,#0f766e,#0891b2)', ctaColor: '#0891b2', layout: 'digest' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#0f766e,#0891b2);padding:28px 32px;border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:space-between;gap:12px">
    <div>
      <div style="color:rgba(255,255,255,.5);font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-family:monospace;margin-bottom:6px">June 2026</div>
      <div style="color:#fff;font-weight:700;font-size:19px;letter-spacing:-0.3px">📚 The Acme Reading List</div>
    </div>
    <div style="background:rgba(255,255,255,.12);border-radius:8px;padding:6px 12px;white-space:nowrap">
      <div style="color:rgba(255,255,255,.7);font-size:10px;font-family:monospace">6 articles</div>
    </div>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">Hi {{first_name}}, here's what the Acme team has been reading, writing, and sharing this month. Grab a coffee ☕</p>

    <div style="border-top:1px solid #f3f4f6;padding-top:24px;margin-bottom:8px">
      <p style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;font-family:monospace;margin:0 0 20px">Featured article</p>
      <div style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:24px">
        <div style="background:linear-gradient(135deg,#0f766e,#0891b2);height:100px;display:flex;align-items:center;justify-content:center;font-size:40px">📈</div>
        <div style="padding:18px 20px">
          <div style="display:inline-block;background:#f0fdfa;color:#0f766e;font-size:11px;font-weight:700;letter-spacing:.06em;padding:3px 9px;border-radius:20px;margin-bottom:10px;font-family:monospace">DELIVERABILITY</div>
          <h3 style="font-size:17px;font-weight:700;color:#111827;margin:0 0 8px;letter-spacing:-0.3px;line-height:1.35">How to hit 99%+ inbox placement — a step-by-step guide</h3>
          <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 14px">We analyzed 2,000 sender accounts and found the 5 factors that predict deliverability with 94% accuracy. Here's what matters most.</p>
          <a href="#" style="color:#0891b2;font-size:13px;font-weight:600;text-decoration:none">Read the full guide →</a>
        </div>
      </div>
    </div>

    <p style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;font-family:monospace;margin:0 0 16px">More from this month</p>
    <div style="display:flex;flex-direction:column;gap:0">
      <div style="display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid #f3f4f6">
        <div style="font-size:24px;min-width:36px">⚡</div>
        <div style="flex:1">
          <div style="display:inline-block;background:#eff6ff;color:#1d4ed8;font-size:10px;font-weight:700;letter-spacing:.06em;padding:2px 7px;border-radius:20px;margin-bottom:6px;font-family:monospace">PRODUCT</div>
          <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px">Send-time optimisation is now on by default</div>
          <div style="font-size:13px;color:#6b7280;line-height:1.55">Zero config. AI picks the best time for each individual contact.</div>
        </div>
        <a href="#" style="color:#0891b2;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;padding-top:6px">Read →</a>
      </div>
      <div style="display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid #f3f4f6">
        <div style="font-size:24px;min-width:36px">🎯</div>
        <div style="flex:1">
          <div style="display:inline-block;background:#fff7ed;color:#c2410c;font-size:10px;font-weight:700;letter-spacing:.06em;padding:2px 7px;border-radius:20px;margin-bottom:6px;font-family:monospace">TIPS</div>
          <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px">Preview text: the 5-word change that lifts opens by 10%</div>
          <div style="font-size:13px;color:#6b7280;line-height:1.55">Most senders completely ignore this field. Here's how to nail it.</div>
        </div>
        <a href="#" style="color:#0891b2;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;padding-top:6px">Read →</a>
      </div>
      <div style="display:flex;align-items:flex-start;gap:14px;padding:14px 0">
        <div style="font-size:24px;min-width:36px">🔬</div>
        <div style="flex:1">
          <div style="display:inline-block;background:#fdf4ff;color:#9333ea;font-size:10px;font-weight:700;letter-spacing:.06em;padding:2px 7px;border-radius:20px;margin-bottom:6px;font-family:monospace">RESEARCH</div>
          <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px">Email benchmark report: B2B vs B2C open rates in 2026</div>
          <div style="font-size:13px;color:#6b7280;line-height:1.55">We analyzed 1 billion sends. The results might surprise you.</div>
        </div>
        <a href="#" style="color:#0891b2;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;padding-top:6px">Read →</a>
      </div>
    </div>

    <div style="text-align:center;margin:28px 0">
      <a href="#" style="background:#0f766e;color:#fff;text-decoration:none;padding:11px 28px;border-radius:7px;font-weight:600;font-size:14px;display:inline-block">Visit the Acme blog →</a>
    </div>

    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      Acme · Monthly reading list<br>
      <a href="#" style="color:#9ca3af">Manage preferences</a> · <a href="#" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</div>`,
  },

  // ── Feature Spotlight ────────────────────────────────────────────────────────
  {
    id: 'feature-spotlight',
    name: 'Feature spotlight',
    category: 'Announcement',
    description: 'Deep-dive on a single new feature with a demo CTA',
    thumbnail: { headerBg: 'linear-gradient(135deg,#92400e,#d97706)', ctaColor: '#f59e0b', layout: 'hero' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#92400e,#d97706);padding:48px 36px;border-radius:12px 12px 0 0;text-align:center">
    <div style="display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fef3c7;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:5px 14px;border-radius:20px;margin-bottom:18px;font-family:monospace">New feature</div>
    <div style="font-size:48px;margin-bottom:14px">⚡</div>
    <h1 style="color:#fff;font-size:28px;font-weight:800;margin:0 0 14px;letter-spacing:-1px;line-height:1.2">Smart Send-Time Optimisation</h1>
    <p style="color:rgba(255,255,255,.8);font-size:15px;line-height:1.7;margin:0;max-width:380px;margin-left:auto;margin-right:auto">We analyse each contact's open history and automatically send at the moment they're most likely to read.</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:15px;line-height:1.7;margin:0 0 20px">Hi {{first_name}},</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">Send time is one of the highest-leverage variables in email marketing — and until now, it's been pure guesswork. Not anymore.</p>

    <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #fde68a">
      <p style="font-size:13px;font-weight:700;color:#92400e;margin:0 0 16px">Here's how it works:</p>
      <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:14px">
        <div style="min-width:32px;height:32px;border-radius:50%;background:#d97706;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none">1</div>
        <div>
          <strong style="color:#111827;font-size:14px">We analyse each contact's history</strong>
          <p style="color:#6b7280;font-size:13px;margin:4px 0 0;line-height:1.6">Acme looks at when each individual subscriber has opened emails in the past.</p>
        </div>
      </div>
      <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:14px">
        <div style="min-width:32px;height:32px;border-radius:50%;background:#d97706;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none">2</div>
        <div>
          <strong style="color:#111827;font-size:14px">A delivery window is predicted</strong>
          <p style="color:#6b7280;font-size:13px;margin:4px 0 0;line-height:1.6">Our model predicts the optimal 1-hour window per contact — no two are the same.</p>
        </div>
      </div>
      <div style="display:flex;gap:14px;align-items:flex-start">
        <div style="min-width:32px;height:32px;border-radius:50%;background:#d97706;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none">3</div>
        <div>
          <strong style="color:#111827;font-size:14px">Your campaign fans out over 24 hours</strong>
          <p style="color:#6b7280;font-size:13px;margin:4px 0 0;line-height:1.6">Each contact receives the email at their personal best time, within your send window.</p>
        </div>
      </div>
    </div>

    <div style="background:#f9fafb;border-radius:10px;padding:20px 24px;margin-bottom:28px;text-align:center">
      <div style="font-size:32px;font-weight:800;color:#d97706;letter-spacing:-1px;margin-bottom:4px">+14%</div>
      <p style="font-size:13px;color:#6b7280;margin:0">average open rate lift in our early-access beta across 400 customers</p>
    </div>

    <div style="text-align:center;margin-bottom:28px">
      <a href="#" style="background:linear-gradient(135deg,#92400e,#d97706);color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 16px rgba(217,119,6,.35)">Enable for my account →</a>
      <div style="font-size:12px;color:#9ca3af;margin-top:10px">Available on all plans · Enabled per campaign</div>
    </div>

    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      Acme · <a href="#" style="color:#9ca3af">View in browser</a> · <a href="#" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</div>`,
  },

  // ── Thank You ────────────────────────────────────────────────────────────────
  {
    id: 'thankyou',
    name: 'Thank you',
    category: 'Relationship',
    description: 'Customer appreciation with social proof and next steps',
    thumbnail: { headerBg: 'linear-gradient(135deg,#064e3b,#0f766e)', ctaColor: '#10b981', layout: 'two-col' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#064e3b,#0f766e);padding:44px 36px;border-radius:12px 12px 0 0;text-align:center">
    <div style="font-size:52px;margin-bottom:14px">🙏</div>
    <h1 style="color:#fff;font-size:26px;font-weight:700;margin:0 0 10px;letter-spacing:-0.5px">Thank you, {{first_name}}!</h1>
    <p style="color:rgba(255,255,255,.8);font-size:14px;margin:0">Your support means everything to our team.</p>
  </div>

  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:15px;line-height:1.7;margin:0 0 20px">Hi {{first_name}},</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">We wanted to take a moment to genuinely say thank you. Customers like you are the reason we push so hard to build something great — and we don't take that trust lightly.</p>

    <div style="background:#f0fdf4;border-radius:10px;padding:22px 24px;margin-bottom:28px">
      <p style="font-size:13px;font-weight:600;color:#065f46;margin:0 0 16px">A quick look at what you've achieved with Acme:</p>
      <div style="display:flex;gap:0;text-align:center">
        <div style="flex:1;padding-right:16px;border-right:1px solid #d1fae5">
          <div style="font-size:28px;font-weight:800;color:#065f46;letter-spacing:-1px">142k</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px">emails sent</div>
        </div>
        <div style="flex:1;padding:0 16px;border-right:1px solid #d1fae5">
          <div style="font-size:28px;font-weight:800;color:#065f46;letter-spacing:-1px">61%</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px">avg open rate</div>
        </div>
        <div style="flex:1;padding-left:16px">
          <div style="font-size:28px;font-weight:800;color:#065f46;letter-spacing:-1px">99.2%</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px">deliverability</div>
        </div>
      </div>
    </div>

    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 24px">As a thank-you, we've added <strong style="color:#374151">2 months of free usage</strong> to your account. No strings attached — it'll show up in your billing summary today.</p>

    <div style="text-align:center;margin-bottom:28px">
      <a href="#" style="background:#10b981;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(16,185,129,.3)">View my account →</a>
    </div>

    <div style="border-top:1px solid #f3f4f6;padding-top:20px">
      <p style="font-size:13px;color:#6b7280;margin:0 0 14px;text-align:center">Love Acme? Share it with a friend and you'll both get a free month.</p>
      <div style="display:flex;gap:10px;justify-content:center">
        <a href="#" style="background:#f3f4f6;color:#374151;text-decoration:none;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:500">Share on Twitter</a>
        <a href="#" style="background:#f3f4f6;color:#374151;text-decoration:none;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:500">Share on LinkedIn</a>
      </div>
    </div>

    <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;text-align:center">Acme · <a href="#" style="color:#9ca3af">Unsubscribe</a></p>
  </div>
</div>`,
  },

  // ── Referral Program ─────────────────────────────────────────────────────────
  {
    id: 'referral',
    name: 'Referral program',
    category: 'Growth',
    description: 'Double-sided reward invite — you get X, your friend gets Y',
    thumbnail: { headerBg: 'linear-gradient(135deg,#be185d,#f43f5e)', ctaColor: '#f43f5e', layout: 'hero' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#be185d,#f43f5e);padding:48px 36px;border-radius:12px 12px 0 0;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">🎁</div>
    <div style="display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:5px 14px;border-radius:20px;margin-bottom:16px;font-family:monospace">Referral reward</div>
    <h1 style="color:#fff;font-size:26px;font-weight:800;margin:0 0 12px;letter-spacing:-0.5px;line-height:1.2">Share Acme, earn free months</h1>
    <p style="color:rgba(255,255,255,.85);font-size:15px;line-height:1.6;margin:0">For every friend who signs up, you both get a free month — no cap.</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:15px;line-height:1.7;margin:0 0 20px">Hi {{first_name}},</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">You've been one of our best customers — and we'd love to grow with people like you. Share your link and you'll both get rewarded instantly when they upgrade.</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px">
      <div style="background:linear-gradient(135deg,#fdf2f8,#fce7f3);border:1px solid #fbcfe8;border-radius:10px;padding:20px;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">🙋</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#be185d;font-family:monospace;margin-bottom:6px">You get</div>
        <div style="font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.5px">1 free month</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">for every referral who upgrades</div>
      </div>
      <div style="background:linear-gradient(135deg,#fdf2f8,#fce7f3);border:1px solid #fbcfe8;border-radius:10px;padding:20px;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">👥</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#be185d;font-family:monospace;margin-bottom:6px">They get</div>
        <div style="font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.5px">30% off</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">their first 3 months</div>
      </div>
    </div>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin-bottom:26px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;font-family:monospace;margin-bottom:10px">Your referral link</div>
      <div style="display:flex;gap:10px;align-items:center">
        <div style="flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:7px;padding:10px 13px;font-family:monospace;font-size:13px;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">acme.co/refer/{{referral_code}}</div>
        <a href="#" style="background:#be185d;color:#fff;text-decoration:none;padding:10px 16px;border-radius:7px;font-weight:600;font-size:13px;white-space:nowrap">Copy link</a>
      </div>
    </div>

    <div style="text-align:center;margin-bottom:28px">
      <p style="font-size:13px;color:#6b7280;margin:0 0 14px">Or share directly:</p>
      <div style="display:flex;gap:10px;justify-content:center">
        <a href="#" style="display:inline-flex;align-items:center;gap:8px;background:#1d9bf0;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;font-size:13px">𝕏 Twitter</a>
        <a href="#" style="display:inline-flex;align-items:center;gap:8px;background:#0a66c2;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;font-size:13px">in LinkedIn</a>
        <a href="#" style="display:inline-flex;align-items:center;gap:8px;background:#25d366;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;font-size:13px">WhatsApp</a>
      </div>
    </div>

    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      No limit on referrals · Rewards credited within 24 hours of upgrade<br>
      <a href="#" style="color:#9ca3af">Referral terms</a> · <a href="#" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</div>`,
  },

  // ── Free Trial Ending ────────────────────────────────────────────────────────
  {
    id: 'trial-ending',
    name: 'Trial ending',
    category: 'Retention',
    description: 'Urgency-driven upgrade nudge before the trial expires',
    thumbnail: { headerBg: 'linear-gradient(135deg,#b45309,#f59e0b)', ctaColor: '#f59e0b', layout: 'minimal' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#b45309,#f59e0b);padding:36px 36px 32px;border-radius:12px 12px 0 0;text-align:center">
    <div style="display:inline-block;background:rgba(255,255,255,.2);border:1.5px solid rgba(255,255,255,.5);border-radius:10px;padding:12px 24px;margin-bottom:18px">
      <div style="color:rgba(255,255,255,.8);font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-family:monospace;margin-bottom:4px">Trial ends in</div>
      <div style="color:#fff;font-size:40px;font-weight:900;letter-spacing:-2px;line-height:1">3 days</div>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;letter-spacing:-0.3px">Don't lose your progress, {{first_name}}</h1>
    <p style="color:rgba(255,255,255,.8);font-size:14px;margin:0">Upgrade now and keep everything you've built.</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 24px">Your free trial wraps up on <strong style="color:#374151">June 13, 2026</strong>. After that, your campaigns will pause and contacts will be locked — unless you're on a paid plan.</p>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:20px;margin-bottom:26px">
      <p style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#92400e;font-family:monospace;margin:0 0 14px">What you'll keep with a paid plan:</p>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:22px;height:22px;border-radius:50%;background:#d97706;display:flex;align-items:center;justify-content:center;flex:none">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><polyline points="2 7 5.5 10.5 12 3" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span style="font-size:14px;color:#374151">All <strong>{{contact_count}}</strong> contacts you've already imported</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:22px;height:22px;border-radius:50%;background:#d97706;display:flex;align-items:center;justify-content:center;flex:none">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><polyline points="2 7 5.5 10.5 12 3" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span style="font-size:14px;color:#374151">All campaign drafts and templates</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:22px;height:22px;border-radius:50%;background:#d97706;display:flex;align-items:center;justify-content:center;flex:none">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><polyline points="2 7 5.5 10.5 12 3" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span style="font-size:14px;color:#374151">Domain verification and sending reputation</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:22px;height:22px;border-radius:50%;background:#d97706;display:flex;align-items:center;justify-content:center;flex:none">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><polyline points="2 7 5.5 10.5 12 3" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span style="font-size:14px;color:#374151">Analytics history and open/click reports</span>
        </div>
      </div>
    </div>

    <div style="text-align:center;margin-bottom:28px">
      <a href="#" style="background:linear-gradient(135deg,#b45309,#f59e0b);color:#fff;text-decoration:none;padding:15px 44px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 16px rgba(245,158,11,.4)">Upgrade now — keep everything →</a>
      <div style="font-size:12px;color:#9ca3af;margin-top:10px">Plans from $29/mo · Cancel anytime</div>
    </div>

    <div style="background:#f9fafb;border-radius:8px;padding:16px 18px;font-size:13px;color:#6b7280;line-height:1.6">
      <strong style="color:#374151">Not ready to upgrade?</strong> Reply to this email and we'll extend your trial by 7 days — no questions asked.
    </div>

    <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;text-align:center">
      Acme · <a href="#" style="color:#9ca3af">See all plans</a> · <a href="#" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</div>`,
  },

  // ── Order Confirmation ───────────────────────────────────────────────────────
  {
    id: 'order-confirm',
    name: 'Order confirmation',
    category: 'Transactional',
    description: 'Clean purchase receipt with order summary and next steps',
    thumbnail: { headerBg: 'linear-gradient(135deg,#14532d,#16a34a)', ctaColor: '#16a34a', layout: 'minimal' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#14532d,#16a34a);padding:40px 36px;border-radius:12px 12px 0 0;text-align:center">
    <div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 8px;letter-spacing:-0.3px">You're all set, {{first_name}}!</h1>
    <p style="color:rgba(255,255,255,.8);font-size:14px;margin:0">Order <strong style="font-family:monospace">#ACM-20260607</strong> confirmed</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:28px">
      <p style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#15803d;font-family:monospace;margin:0 0 14px">Order summary</p>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #dcfce7">
        <div>
          <div style="font-size:14px;font-weight:600;color:#111827">Pro Plan — Annual</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px">Up to 100k contacts · All features</div>
        </div>
        <div style="font-family:monospace;font-weight:700;font-size:15px;color:#111827">$299.00</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #dcfce7">
        <span style="font-size:13px;color:#6b7280">Discount (SUMMER30)</span>
        <span style="font-family:monospace;font-size:13px;color:#16a34a;font-weight:600">−$90.00</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #dcfce7">
        <span style="font-size:13px;color:#6b7280">Tax</span>
        <span style="font-family:monospace;font-size:13px;color:#374151">$20.90</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px">
        <span style="font-size:14px;font-weight:700;color:#111827">Total charged</span>
        <span style="font-family:monospace;font-weight:800;font-size:17px;color:#111827">$229.90</span>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px">
      <div style="background:#f9fafb;border-radius:8px;padding:16px;border:1px solid #f3f4f6">
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;font-family:monospace;margin-bottom:8px">Billing</div>
        <div style="font-size:13px;color:#374151;line-height:1.6">{{first_name}} {{last_name}}<br>Visa ending ··4242<br>{{city}}, {{country}}</div>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;border:1px solid #f3f4f6">
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;font-family:monospace;margin-bottom:8px">Next renewal</div>
        <div style="font-size:13px;color:#374151;line-height:1.6">June 7, 2027<br>$299.00/yr<br><a href="#" style="color:#16a34a;text-decoration:none;font-weight:500">Manage billing →</a></div>
      </div>
    </div>

    <div style="margin-bottom:28px">
      <p style="font-size:13px;font-weight:600;color:#374151;margin:0 0 14px">What's next:</p>
      <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px">
        <div style="min-width:28px;height:28px;border-radius:50%;background:#dcfce7;color:#15803d;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none">1</div>
        <div><strong style="font-size:14px;color:#111827">Your plan is already active</strong><p style="font-size:13px;color:#6b7280;margin:3px 0 0;line-height:1.5">All features are unlocked. Start sending right now.</p></div>
      </div>
      <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px">
        <div style="min-width:28px;height:28px;border-radius:50%;background:#dcfce7;color:#15803d;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none">2</div>
        <div><strong style="font-size:14px;color:#111827">Receipt sent to {{email}}</strong><p style="font-size:13px;color:#6b7280;margin:3px 0 0;line-height:1.5">Keep it for your records or expense claims.</p></div>
      </div>
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div style="min-width:28px;height:28px;border-radius:50%;background:#dcfce7;color:#15803d;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none">3</div>
        <div><strong style="font-size:14px;color:#111827">Onboarding call booked for you</strong><p style="font-size:13px;color:#6b7280;margin:3px 0 0;line-height:1.5">A success manager will reach out in the next 24 hours.</p></div>
      </div>
    </div>

    <div style="text-align:center;margin-bottom:28px">
      <a href="#" style="background:#16a34a;color:#fff;text-decoration:none;padding:13px 36px;border-radius:8px;font-weight:600;font-size:14px;display:inline-block;box-shadow:0 4px 12px rgba(22,163,74,.3)">Go to my dashboard →</a>
    </div>

    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      Questions? <a href="#" style="color:#16a34a;text-decoration:none">Contact support</a> · <a href="#" style="color:#9ca3af">View invoice</a><br>
      Acme Inc. · 100 Market St, San Francisco CA 94105
    </p>
  </div>
</div>`,
  },

  // ── Webinar Follow-up ────────────────────────────────────────────────────────
  {
    id: 'webinar-followup',
    name: 'Webinar follow-up',
    category: 'Events',
    description: 'Post-event recap with recording link and key takeaways',
    thumbnail: { headerBg: 'linear-gradient(135deg,#4338ca,#2563eb)', ctaColor: '#4338ca', layout: 'event' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#4338ca,#2563eb);padding:44px 36px;border-radius:12px 12px 0 0;text-align:center">
    <div style="font-size:44px;margin-bottom:14px">🎬</div>
    <div style="display:inline-block;background:rgba(255,255,255,.15);color:#c7d2fe;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:5px 14px;border-radius:20px;margin-bottom:16px;font-family:monospace">Recording ready</div>
    <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 10px;letter-spacing:-0.3px;line-height:1.3">Thanks for joining us, {{first_name}}!</h1>
    <p style="color:rgba(255,255,255,.8);font-size:14px;margin:0">The full recording from today's webinar is ready to watch.</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 24px">What an incredible session — over 1,200 people joined live, and the Q&A was one of the best we've ever had. Here's everything you need to review and share.</p>

    <div style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);border-radius:12px;padding:24px;margin-bottom:28px;text-align:center">
      <div style="font-size:36px;margin-bottom:10px">▶️</div>
      <div style="font-size:15px;font-weight:600;color:#111827;margin-bottom:6px">Scaling Email Deliverability in 2026</div>
      <div style="font-size:12px;color:#6b7280;margin-bottom:16px">60 min · Full session with Q&amp;A</div>
      <a href="#" style="background:#4338ca;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;display:inline-block;box-shadow:0 4px 14px rgba(67,56,202,.35)">Watch the recording →</a>
    </div>

    <div style="margin-bottom:28px">
      <p style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;font-family:monospace;margin:0 0 14px">Key takeaways</p>
      <div style="display:flex;flex-direction:column;gap:0">
        <div style="display:flex;gap:14px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #f3f4f6">
          <div style="min-width:28px;height:28px;border-radius:50%;background:#eef2ff;color:#4338ca;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;flex:none">1</div>
          <div><strong style="font-size:14px;color:#111827">SPF, DKIM, DMARC in 30 minutes</strong><p style="font-size:13px;color:#6b7280;margin:3px 0 0;line-height:1.5">The exact DNS records to add, in order, with zero guesswork. Skip to 8:40.</p></div>
        </div>
        <div style="display:flex;gap:14px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #f3f4f6">
          <div style="min-width:28px;height:28px;border-radius:50%;background:#eef2ff;color:#4338ca;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;flex:none">2</div>
          <div><strong style="font-size:14px;color:#111827">How to read bounce codes (and fix them)</strong><p style="font-size:13px;color:#6b7280;margin:3px 0 0;line-height:1.5">The 10 most common codes and what to actually do about each. Skip to 24:15.</p></div>
        </div>
        <div style="display:flex;gap:14px;align-items:flex-start;padding:12px 0">
          <div style="min-width:28px;height:28px;border-radius:50%;background:#eef2ff;color:#4338ca;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;flex:none">3</div>
          <div><strong style="font-size:14px;color:#111827">The list hygiene checklist we use internally</strong><p style="font-size:13px;color:#6b7280;margin:3px 0 0;line-height:1.5">Free download — the exact process our team runs before every send. Skip to 42:00.</p></div>
        </div>
      </div>
    </div>

    <div style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:10px;padding:18px 20px;margin-bottom:28px;display:flex;gap:14px;align-items:center">
      <div style="font-size:28px;flex:none">📥</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:2px">Download the slide deck</div>
        <div style="font-size:12px;color:#6b7280">PDF · 48 slides · Includes the checklist template</div>
      </div>
      <a href="#" style="background:#4338ca;color:#fff;text-decoration:none;padding:8px 16px;border-radius:7px;font-weight:600;font-size:13px;white-space:nowrap">Download</a>
    </div>

    <div style="text-align:center;margin-bottom:28px">
      <p style="font-size:13px;color:#6b7280;margin:0 0 12px">Want to go deeper? Our next live session:</p>
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;display:inline-block;text-align:left">
        <div style="font-size:13px;font-weight:600;color:#111827">Advanced Segmentation Masterclass</div>
        <div style="font-size:12px;color:#6b7280;margin-top:3px">July 3, 2026 · 11 AM PT · Free</div>
        <a href="#" style="color:#4338ca;font-size:13px;font-weight:600;text-decoration:none;display:block;margin-top:8px">Reserve my spot →</a>
      </div>
    </div>

    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      <a href="#" style="color:#9ca3af">Share this recording</a> · <a href="#" style="color:#9ca3af">Unsubscribe from event emails</a>
    </p>
  </div>
</div>`,
  },

  // ── Seasonal Greeting ────────────────────────────────────────────────────────
  {
    id: 'seasonal-greeting',
    name: 'Seasonal greeting',
    category: 'Relationship',
    description: 'Warm end-of-year message with year-in-review highlights',
    thumbnail: { headerBg: 'linear-gradient(135deg,#78350f,#dc2626)', ctaColor: '#fbbf24', layout: 'minimal' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(160deg,#7f1d1d,#991b1b,#78350f);padding:52px 36px;border-radius:12px 12px 0 0;text-align:center;position:relative;overflow:hidden">
    <div style="font-size:12px;letter-spacing:.3em;color:rgba(255,255,255,.5);text-transform:uppercase;font-family:monospace;margin-bottom:16px">Happy holidays</div>
    <div style="font-size:52px;margin-bottom:14px">🎄</div>
    <h1 style="color:#fff;font-size:28px;font-weight:800;margin:0 0 10px;letter-spacing:-0.8px;line-height:1.2">Wishing you a wonderful<br>end of year, {{first_name}}</h1>
    <p style="color:rgba(255,255,255,.75);font-size:14px;margin:0">From all of us at Acme — thank you.</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:15px;line-height:1.7;margin:0 0 20px">Hi {{first_name}},</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">As the year wraps up, we wanted to take a moment to genuinely say thank you. Building Acme alongside customers like you has been the highlight of 2026 for our team.</p>

    <div style="background:linear-gradient(135deg,#7f1d1d,#991b1b);border-radius:12px;padding:26px;margin-bottom:28px">
      <p style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.6);font-family:monospace;margin:0 0 16px;text-align:center">Your 2026 in numbers</p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">
        <div>
          <div style="font-size:28px;font-weight:900;color:#fbbf24;letter-spacing:-1px">{{emails_sent}}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.65);margin-top:4px">emails sent</div>
        </div>
        <div>
          <div style="font-size:28px;font-weight:900;color:#fbbf24;letter-spacing:-1px">{{campaigns_count}}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.65);margin-top:4px">campaigns</div>
        </div>
        <div>
          <div style="font-size:28px;font-weight:900;color:#fbbf24;letter-spacing:-1px">{{open_rate}}%</div>
          <div style="font-size:11px;color:rgba(255,255,255,.65);margin-top:4px">avg open rate</div>
        </div>
      </div>
    </div>

    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 22px">And as our way of saying thank you, we've added a little something to your account:</p>

    <div style="border:2px dashed #fbbf24;border-radius:10px;padding:20px;text-align:center;margin-bottom:28px;background:#fffbeb">
      <div style="font-size:32px;margin-bottom:8px">🎁</div>
      <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:4px">1 free month added to your plan</div>
      <div style="font-size:13px;color:#6b7280">No action needed — it's already in your account.</div>
    </div>

    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 24px">Here's to an even bigger 2027. We can't wait to keep building alongside you.</p>

    <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 28px">With gratitude,<br><strong>The Acme Team</strong></p>

    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      Acme · San Francisco, CA<br>
      <a href="#" style="color:#9ca3af">Manage preferences</a> · <a href="#" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</div>`,
  },

  // ── Educational Drip ─────────────────────────────────────────────────────────
  {
    id: 'educational-drip',
    name: 'Educational drip',
    category: 'Onboarding',
    description: 'Lesson-style email for tip sequences and onboarding flows',
    thumbnail: { headerBg: 'linear-gradient(135deg,#0e7490,#0891b2)', ctaColor: '#0891b2', layout: 'steps' },
    html: `<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;color:#374151">
  <div style="background:linear-gradient(135deg,#0e7490,#0891b2);padding:36px 36px 32px;border-radius:12px 12px 0 0">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.15);border-radius:20px;padding:5px 12px">
        <span style="color:rgba(255,255,255,.8);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-family:monospace">Lesson 3 of 7</span>
      </div>
      <div style="display:flex;gap:4px">
        <div style="width:22px;height:4px;border-radius:2px;background:#fff;opacity:1"></div>
        <div style="width:22px;height:4px;border-radius:2px;background:#fff;opacity:1"></div>
        <div style="width:22px;height:4px;border-radius:2px;background:#fff;opacity:1"></div>
        <div style="width:22px;height:4px;border-radius:2px;background:#fff;opacity:.3"></div>
        <div style="width:22px;height:4px;border-radius:2px;background:#fff;opacity:.3"></div>
        <div style="width:22px;height:4px;border-radius:2px;background:#fff;opacity:.3"></div>
        <div style="width:22px;height:4px;border-radius:2px;background:#fff;opacity:.3"></div>
      </div>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 10px;letter-spacing:-0.3px;line-height:1.3">How to write subject lines<br>that actually get opened</h1>
    <p style="color:rgba(255,255,255,.8);font-size:13px;margin:0">Today's lesson · 4 min read</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:36px">
    <p style="font-size:15px;line-height:1.7;margin:0 0 20px">Hi {{first_name}},</p>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">Welcome back to the Email Mastery series. In Lesson 3, we're tackling the most important 60 characters in any campaign — the subject line.</p>

    <div style="background:#f0fdfa;border-left:4px solid #0891b2;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:28px">
      <p style="font-size:13px;font-weight:700;color:#0e7490;margin:0 0 4px">Today's core principle:</p>
      <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;font-style:italic">"The best subject line is the one that makes the reader feel the email was written only for them."</p>
    </div>

    <div style="margin-bottom:28px">
      <p style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;font-family:monospace;margin:0 0 16px">The 5 subject line formulas that work</p>
      <div style="display:flex;flex-direction:column;gap:0">
        <div style="padding:14px 0;border-bottom:1px solid #f3f4f6">
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="min-width:26px;height:26px;border-radius:6px;background:#cffafe;color:#0e7490;font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center;flex:none;font-family:monospace">01</div>
            <div>
              <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px">The Curiosity Gap</div>
              <div style="font-size:13px;color:#6b7280;line-height:1.55;margin-bottom:6px">Leave something unsaid that forces the open.</div>
              <div style="background:#f9fafb;border-radius:6px;padding:8px 12px;font-family:monospace;font-size:12px;color:#374151">"The mistake 94% of senders make (are you one of them?)"</div>
            </div>
          </div>
        </div>
        <div style="padding:14px 0;border-bottom:1px solid #f3f4f6">
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="min-width:26px;height:26px;border-radius:6px;background:#cffafe;color:#0e7490;font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center;flex:none;font-family:monospace">02</div>
            <div>
              <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px">The Specific Number</div>
              <div style="font-size:13px;color:#6b7280;line-height:1.55;margin-bottom:6px">Specificity signals credibility. Avoid round numbers.</div>
              <div style="background:#f9fafb;border-radius:6px;padding:8px 12px;font-family:monospace;font-size:12px;color:#374151">"We analyzed 1,482 campaigns. Here's what we found."</div>
            </div>
          </div>
        </div>
        <div style="padding:14px 0;border-bottom:1px solid #f3f4f6">
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="min-width:26px;height:26px;border-radius:6px;background:#cffafe;color:#0e7490;font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center;flex:none;font-family:monospace">03</div>
            <div>
              <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px">Direct Personalisation</div>
              <div style="font-size:13px;color:#6b7280;line-height:1.55;margin-bottom:6px">First name in subject line lifts opens ~12% on average.</div>
              <div style="background:#f9fafb;border-radius:6px;padding:8px 12px;font-family:monospace;font-size:12px;color:#374151">"{{first_name}}, your June report is ready"</div>
            </div>
          </div>
        </div>
        <div style="padding:14px 0">
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="min-width:26px;height:26px;border-radius:6px;background:#cffafe;color:#0e7490;font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center;flex:none;font-family:monospace">04</div>
            <div>
              <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px">The Honest Nudge</div>
              <div style="font-size:13px;color:#6b7280;line-height:1.55;margin-bottom:6px">Counterintuitively, transparency outperforms hype.</div>
              <div style="background:#f9fafb;border-radius:6px;padding:8px 12px;font-family:monospace;font-size:12px;color:#374151">"This is a sales email. Here's why it's worth 60 seconds."</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="background:#f0fdfa;border-radius:10px;padding:20px;margin-bottom:28px">
      <p style="font-size:13px;font-weight:600;color:#0e7490;margin:0 0 10px">✏️ Your homework before Lesson 4:</p>
      <p style="font-size:13px;color:#374151;line-height:1.65;margin:0">Pick your next campaign and write 5 subject lines using 3 different formulas above. Then A/B test two of them. Reply to this email with your results — the best ones get featured in next month's digest.</p>
    </div>

    <div style="text-align:center;margin-bottom:28px">
      <a href="#" style="background:#0891b2;color:#fff;text-decoration:none;padding:12px 30px;border-radius:8px;font-weight:600;font-size:14px;display:inline-block">Continue to Lesson 4 →</a>
      <div style="font-size:12px;color:#9ca3af;margin-top:8px">A/B testing your subject lines</div>
    </div>

    <p style="font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:20px;margin:0;text-align:center">
      You're receiving this as part of the Email Mastery series.<br>
      <a href="#" style="color:#9ca3af">Pause the series</a> · <a href="#" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</div>`,
  },
];
