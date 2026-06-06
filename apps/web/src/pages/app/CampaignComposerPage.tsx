import { useState, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { resolveMergeTags } from '../../lib/utils/merge-tags.js';

type Step = 1 | 2 | 3 | 4;

const SEGMENTS = [
  { id: 's1', name: 'Active subscribers', desc: 'Subscribed and never bounced', count: 46980 },
  { id: 's2', name: 'All contacts', desc: 'Every contact in your workspace', count: 48210 },
  { id: 's3', name: 'Pro & Enterprise', desc: 'Contacts tagged Pro or Enterprise', count: 12440 },
  { id: 's4', name: 'New signups', desc: 'Added in the last 30 days', count: 3180 },
];

export function CampaignComposerPage() {
  const navigate = useNavigate();
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    name: '', fromName: '', fromEmail: '', subject: '', body: '',
  });
  const [selectedSegId, setSelectedSegId] = useState('s1');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sent, setSent] = useState(false);

  const selectedSeg = SEGMENTS.find(s => s.id === selectedSegId) ?? SEGMENTS[0]!;

  const update = useCallback((field: keyof typeof form, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  }, []);

  const stepLabels = ['Content', 'Audience', 'Schedule', 'Review'];

  function goTo(n: Step) {
    setStep(n);
    document.getElementById('viewWrap')?.scrollTo(0, 0);
  }

  function handleSend() {
    setSent(true);
  }

  if (sent) {
    return (
      <div className="view active">
        <Topbar crumb="Campaigns" title="New campaign" onMenuOpen={onMenuOpen} />
        <div style={{ padding: '28px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>
          <div className="card card-pad">
            <div className="send-success">
              <div className="ss-ico">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <h2>{scheduleMode === 'now' ? 'Campaign launched' : 'Campaign scheduled'}</h2>
              <p>
                <b>{form.name || 'Your campaign'}</b> {scheduleMode === 'now' ? 'is now fanning out to' : 'will send to'}{' '}
                <b>{selectedSeg.count.toLocaleString()}</b> contacts in <b>{selectedSeg.name}</b>.
              </p>
              <div className="ss-actions">
                <button className="btn btn-primary" onClick={() => navigate('/campaigns/1')}>View campaign</button>
                <button className="btn btn-ghost" onClick={() => navigate('/campaigns')}>Back to campaigns</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view active">
      <Topbar
        crumb="Campaigns"
        title={step === 4 ? 'Review & send' : 'New campaign'}
        onMenuOpen={onMenuOpen}
      />
      <div style={{ padding: '28px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>

        {/* Stepper */}
        <div className="stepper">
          {stepLabels.map((label, i) => {
            const n = (i + 1) as Step;
            const isActive = n === step;
            const isDone = n < step;
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? '1' : undefined }}>
                <div
                  className={`cstep${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
                  style={{ cursor: isDone ? 'pointer' : 'default' }}
                  onClick={() => isDone && goTo(n)}
                >
                  <span className="cnum">{isDone ? '✓' : n}</span>
                  <span className="clabel">{label}</span>
                </div>
                {i < 3 && <div className={`cstep-line${isDone || isActive ? ' done' : ''}`} />}
              </div>
            );
          })}
        </div>

        <div className="composer" id="composer">
          <div className="composer-main">

            {/* Step 1: Content */}
            {step === 1 && (
              <div className="step-panel active">
                <div className="field">
                  <label>Campaign name</label>
                  <input className="inp" placeholder="e.g. Spring Launch 2026" value={form.name} onChange={e => update('name', e.target.value)} />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>From name</label>
                    <input className="inp" placeholder="Acme Team" value={form.fromName} onChange={e => update('fromName', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>From email</label>
                    <div className="inp-affix">
                      <input placeholder="hello" value={form.fromEmail} onChange={e => update('fromEmail', e.target.value)} />
                      <span className="pfx">@acme.co</span>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label>Subject line</label>
                  <input className="inp" placeholder="Your spring upgrade is here ✨" value={form.subject} onChange={e => update('subject', e.target.value)} />
                  <div className="hint">Use <code>{'{{first_name}}'}</code> to personalize</div>
                </div>
                <div className="field">
                  <label>Email body</label>
                  <div className="toolbar">
                    {['B', 'I', 'U'].map(f => <button key={f} className="tb-btn"><b>{f}</b></button>)}
                    <div className="tb-sep" />
                    <button className="tb-btn" title="Link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                    </button>
                  </div>
                  <textarea className="inp" placeholder={`Hi {{first_name}},\n\nYour message here…`} value={form.body} onChange={e => update('body', e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 2: Audience */}
            {step === 2 && (
              <div className="step-panel active">
                <div className="field">
                  <label>Choose a segment</label>
                  <div className="seg-pick" id="segPick">
                    {SEGMENTS.map(seg => (
                      <button
                        key={seg.id}
                        className={`seg-card${selectedSegId === seg.id ? ' selected' : ''}`}
                        onClick={() => setSelectedSegId(seg.id)}
                      >
                        <span className="seg-radio" />
                        <span className="seg-body">
                          <span className="seg-name">{seg.name}</span>
                          <span className="seg-desc">{seg.desc}</span>
                        </span>
                        <span className="seg-count">
                          {seg.count.toLocaleString()}
                          <small>contacts</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="callout-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  <div className="cbt"><b>Suppressions applied automatically.</b> Unsubscribed, bounced, and complained contacts are always excluded — no extra step required.</div>
                </div>
              </div>
            )}

            {/* Step 3: Schedule */}
            {step === 3 && (
              <div className="step-panel active">
                <div className="field">
                  <label>When to send</label>
                  <div className="radio-cards">
                    {[
                      { id: 'now', title: 'Send now', desc: 'Queued immediately on launch' },
                      { id: 'later', title: 'Schedule for later', desc: 'Pick a date and time' },
                    ].map(opt => (
                      <div
                        key={opt.id}
                        className={`radio-card${scheduleMode === opt.id ? ' selected' : ''}`}
                        onClick={() => setScheduleMode(opt.id as 'now' | 'later')}
                      >
                        <div className="rc-top">
                          <span className="rc-dot" />
                          <span className="rc-name">{opt.title}</span>
                        </div>
                        <div className="rc-desc">{opt.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {scheduleMode === 'later' && (
                  <div className="field">
                    <label>Send at</label>
                    <input type="datetime-local" className="inp" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                  </div>
                )}
                <div className="card card-pad" style={{ marginTop: 20, background: 'var(--bg)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--slate-3)', marginBottom: 6 }}>Rate estimate</div>
                  <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>
                    <span id="rateRecip" style={{ fontFamily: 'var(--display)', fontWeight: 600, color: 'var(--ink)' }}>
                      {selectedSeg.count.toLocaleString()}
                    </span> contacts ≈{' '}
                    <span id="rateEta">
                      {selectedSeg.count <= 2000
                        ? `~${Math.ceil(selectedSeg.count / 2000 * 60)} minutes`
                        : `~${(selectedSeg.count / 2000).toFixed(1)} hours`}
                    </span> at 2,000/hour
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="step-panel active">
                <div className="card card-pad">
                  <div className="review-list">
                    {[
                      { k: 'Campaign', v: form.name || '—', sub: null, goto: 1 },
                      { k: 'Subject', v: resolveMergeTags(form.subject) || '—', sub: null, goto: 1 },
                      { k: 'From', v: `${form.fromName} <${form.fromEmail}@acme.co>`, sub: null, goto: 1 },
                      { k: 'Audience', v: selectedSeg.name, sub: `${selectedSeg.count.toLocaleString()} recipients · suppressions excluded`, goto: 2 },
                      { k: 'Delivery', v: scheduleMode === 'now' ? 'Send now' : 'Scheduled', sub: scheduleMode === 'later' ? scheduledAt : 'Queued immediately on launch', goto: 3 },
                    ].map(row => (
                      <div key={row.k} className="review-row">
                        <span className="rk">{row.k}</span>
                        <span className="rv">
                          {row.v}
                          {row.sub && <span className="rsub">{row.sub}</span>}
                        </span>
                        <button className="edit-link" onClick={() => goTo(row.goto as Step)}>Edit</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer navigation */}
            <div className="composer-foot">
              <button
                className="btn btn-ghost"
                style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
                onClick={() => goTo((step - 1) as Step)}
              >
                ← Back
              </button>
              <div className="spacer" />
              {step < 4 && (
                <button className="btn btn-primary" onClick={() => goTo((step + 1) as Step)}>
                  Continue →
                </button>
              )}
              {step === 4 && (
                <button className="btn btn-coral" onClick={handleSend}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
                  Send campaign
                </button>
              )}
            </div>
          </div>

          {/* Live email preview */}
          <div className="preview-col">
            <div className="email-preview">
              <div className="ep-bar">
                <span className="ept">Inbox preview</span>
              </div>
              <div className="ep-head">
                <div className="ep-subject" style={!form.subject ? { color: 'var(--faint)', fontStyle: 'italic' } : {}}>
                  {resolveMergeTags(form.subject) || 'Your subject line'}
                </div>
                <div className="ep-from">
                  <span className="epa">{(form.fromName[0] ?? 'A').toUpperCase()}</span>
                  <div>
                    <div className="epf-name">{form.fromName || 'Sender name'}</div>
                    <div className="epf-meta">{(form.fromEmail || 'hello') + '@acme.co'}</div>
                  </div>
                </div>
              </div>
              <div className="ep-body" style={!form.body ? { color: 'var(--faint)', fontStyle: 'italic' } : {}}>
                {resolveMergeTags(form.body) || 'Your email body…'}
                {form.body && (
                  <div>
                    <span className="ep-cta">View offer →</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
