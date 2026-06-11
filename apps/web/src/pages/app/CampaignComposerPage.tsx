import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { resolveMergeTags } from '../../lib/utils/merge-tags.js';
import { EMAIL_TEMPLATES, type EmailTemplate } from '../../data/email-templates.js';

type Step = 1 | 2 | 3 | 4;

const SEGMENTS = [
  { id: 's1', name: 'Active subscribers', desc: 'Subscribed and never bounced', count: 46980 },
  { id: 's2', name: 'All contacts', desc: 'Every contact in your workspace', count: 48210 },
  { id: 's3', name: 'Pro & Enterprise', desc: 'Contacts tagged Pro or Enterprise', count: 12440 },
  { id: 's4', name: 'New signups', desc: 'Added in the last 30 days', count: 3180 },
];

const PRESET_COLORS = [
  '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db',
  '#dc2626', '#ea580c', '#d97706', '#16a34a', '#0891b2',
  '#2563eb', '#7c3aed', '#db2777', '#be185d', '#064e3b',
  '#fca5a5', '#fed7aa', '#fef08a', '#bbf7d0', '#bfdbfe',
];

const HIGHLIGHT_COLORS = [
  'REMOVE',
  '#fef08a', '#fde047', '#fcd34d', '#fca5a5',
  '#fed7aa', '#d9f99d', '#86efac', '#6ee7b7',
  '#93c5fd', '#c4b5fd', '#f9a8d4', '#e9d5ff',
  '#ffffff', '#f3f4f6', '#dbeafe', '#dcfce7',
  '#fef9c3', '#fee2e2', '#e0e7ff', '#f0fdf4',
];

// ── Template thumbnail ────────────────────────────────────────────────────────

function TemplateThumbnail({ t }: { t: EmailTemplate }) {
  const { headerBg, ctaColor, layout } = t.thumbnail;

  const Line = ({ w = '100%', h = 4, c = '#e5e7eb', mt = 0 }: { w?: string; h?: number; c?: string; mt?: number }) => (
    <div style={{ height: h, borderRadius: 3, background: c, width: w, marginTop: mt }} />
  );

  if (layout === 'minimal') {
    return (
      <div style={{ background: headerBg, borderRadius: '7px 7px 0 0', padding: '12px 10px', minHeight: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Line w="60%" h={6} c="rgba(255,255,255,.5)" />
        <Line w="40%" h={4} c="rgba(255,255,255,.3)" mt={5} />
      </div>
    );
  }

  if (layout === 'promo') {
    return (
      <div style={{ background: headerBg, borderRadius: '7px 7px 0 0', padding: '14px 10px', textAlign: 'center' }}>
        <div style={{ fontSize: 18, lineHeight: 1 }}>🎉</div>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1, marginTop: 4, letterSpacing: -1 }}>30%</div>
        <div style={{ background: 'rgba(255,255,255,.2)', border: '1.5px dashed rgba(255,255,255,.5)', borderRadius: 4, padding: '3px 8px', marginTop: 6, display: 'inline-block' }}>
          <div style={{ color: '#fff', fontSize: 8, fontWeight: 700, letterSpacing: 1, fontFamily: 'monospace' }}>SUMMER30</div>
        </div>
      </div>
    );
  }

  if (layout === 'event') {
    return (
      <div style={{ background: headerBg, borderRadius: '7px 7px 0 0', padding: '14px 10px', textAlign: 'center' }}>
        <div style={{ fontSize: 18 }}>🎤</div>
        <Line w="70%" h={5} c="rgba(255,255,255,.6)" mt={6} />
        <Line w="50%" h={3} c="rgba(255,255,255,.3)" mt={4} />
        <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'center' }}>
          {['Jun 19', '11 AM', 'Online'].map(s => (
            <div key={s} style={{ background: 'rgba(255,255,255,.15)', borderRadius: 3, padding: '2px 5px', fontSize: 7, color: '#fff', fontFamily: 'monospace' }}>{s}</div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'digest') {
    return (
      <div style={{ background: headerBg, borderRadius: '7px 7px 0 0', overflow: 'hidden' }}>
        <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>📰 Digest</div>
          <div style={{ color: '#6b7280', fontSize: 7, fontFamily: 'monospace' }}>NO. 42</div>
        </div>
        <div style={{ background: ctaColor, padding: '10px' }}>
          <Line w="80%" h={4} c="rgba(255,255,255,.7)" />
          <Line w="60%" h={3} c="rgba(255,255,255,.4)" mt={3} />
          <div style={{ background: '#fff', borderRadius: 3, width: 50, height: 14, marginTop: 8 }} />
        </div>
      </div>
    );
  }

  if (layout === 'steps') {
    return (
      <div style={{ background: headerBg, borderRadius: '7px 7px 0 0', padding: '16px 10px', textAlign: 'center' }}>
        <div style={{ fontSize: 18 }}>👋</div>
        <Line w="65%" h={5} c="rgba(255,255,255,.6)" mt={6} />
        <Line w="45%" h={3} c="rgba(255,255,255,.3)" mt={4} />
      </div>
    );
  }

  // hero / two-col / default
  return (
    <div style={{ background: headerBg, borderRadius: '7px 7px 0 0', padding: '16px 10px', textAlign: 'center' }}>
      <div style={{ display: 'inline-block', background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '2px 8px', marginBottom: 6 }}>
        <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 7, letterSpacing: 1, fontFamily: 'monospace' }}>NEW</div>
      </div>
      <Line w="75%" h={5} c="rgba(255,255,255,.7)" mt={4} />
      <Line w="55%" h={3} c="rgba(255,255,255,.4)" mt={4} />
      <div style={{ background: ctaColor, borderRadius: 4, width: 60, height: 14, margin: '10px auto 0', opacity: 0.9 }} />
    </div>
  );
}

// ── Template preview modal ────────────────────────────────────────────────────

function TemplatePreviewModal({ templates, index, onNavigate, onSelect, onClose }: {
  templates: EmailTemplate[];
  index: number;
  onNavigate: (i: number) => void;
  onSelect: (t: EmailTemplate) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const t = templates[index]!;
  const hasPrev = index > 0;
  const hasNext = index < templates.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(index + 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, onNavigate, index, hasPrev, hasNext]);

  return (
    <div className="tpl-modal-backdrop" onMouseDown={onClose}>
      <div className="tpl-modal" onMouseDown={e => e.stopPropagation()}>
        <div className="tpl-modal-hd">
          <div className="tpl-modal-meta">
            <div className="tpl-modal-name">{t.name}</div>
            <div className="tpl-modal-desc">{t.category} · {t.description}</div>
          </div>
          <div className="tpl-modal-acts">
            <div className="ep-toggle">
              <button className={`ep-toggle-btn${mode === 'desktop' ? ' active' : ''}`} onClick={() => setMode('desktop')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                Desktop
              </button>
              <button className={`ep-toggle-btn${mode === 'mobile' ? ' active' : ''}`} onClick={() => setMode('mobile')}>
                <svg width="11" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="3"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/></svg>
                Mobile
              </button>
            </div>
            <div className="tpl-nav">
              <button className="tpl-nav-btn" disabled={!hasPrev} onClick={() => onNavigate(index - 1)} aria-label="Previous template">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span className="tpl-nav-count">{index + 1} / {templates.length}</span>
              <button className="tpl-nav-btn" disabled={!hasNext} onClick={() => onNavigate(index + 1)} aria-label="Next template">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { onSelect(t); onClose(); }}>
              Use template →
            </button>
            <button className="btn btn-ghost btn-sm tpl-modal-close" onClick={onClose} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div className="tpl-modal-body">
          {t.html ? (
            mode === 'desktop'
              ? <GmailDesktop subject={t.name} fromName="Your Company" fromEmail="hello@yourcompany.com" bodyHtml={t.html} />
              : <PhoneFrame subject={t.name} fromName="Your Company" fromEmail="hello@yourcompany.com" bodyHtml={t.html} />
          ) : (
            <div className="tpl-preview-blank">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
              <p>Blank canvas — build your email in the rich editor</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Template picker ───────────────────────────────────────────────────────────

function TemplatePicker({ onSelect }: { onSelect: (t: EmailTemplate) => void }) {
  const categories = ['All', ...Array.from(new Set(EMAIL_TEMPLATES.map(t => t.category)))];
  const [cat, setCat] = useState('All');
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const filtered = cat === 'All' ? EMAIL_TEMPLATES : EMAIL_TEMPLATES.filter(t => t.category === cat);

  return (
    <>
      <div className="tpl-picker">
        <div className="tpl-cats">
          {categories.map(c => (
            <button key={c} className={`tpl-cat${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="tpl-grid">
          {filtered.map((t, i) => (
            <button key={t.id} className="tpl-card" onClick={() => setPreviewIdx(i)}>
              <div className="tpl-thumb">
                <TemplateThumbnail t={t} />
                <div className="tpl-body-preview">
                  <div style={{ height: 4, borderRadius: 3, background: '#e5e7eb', width: '85%' }} />
                  <div style={{ height: 3, borderRadius: 3, background: '#f3f4f6', width: '70%', marginTop: 4 }} />
                  <div style={{ height: 3, borderRadius: 3, background: '#f3f4f6', width: '90%', marginTop: 3 }} />
                  <div style={{ background: t.thumbnail.ctaColor, borderRadius: 4, height: 14, width: 64, marginTop: 8, opacity: 0.8 }} />
                </div>
              </div>
              <div className="tpl-info">
                <div className="tpl-name">{t.name}</div>
                <div className="tpl-cat-tag">{t.category}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {previewIdx !== null && (
        <TemplatePreviewModal
          templates={filtered}
          index={previewIdx}
          onNavigate={setPreviewIdx}
          onSelect={onSelect}
          onClose={() => setPreviewIdx(null)}
        />
      )}
    </>
  );
}

// ── Image toolbar ────────────────────────────────────────────────────────────

function ImageToolbar({ img, editorEl, onChange, onClose }: {
  img: HTMLImageElement;
  editorEl: HTMLDivElement;
  onChange: (html: string) => void;
  onClose: () => void;
}) {
  const [tbPos, setTbPos] = useState({ top: 0, left: 0 });
  const [wInput, setWInput] = useState('');

  const sync = () => onChange(editorEl.innerHTML);

  const reposition = useCallback(() => {
    const r = img.getBoundingClientRect();
    setTbPos({
      top: Math.max(8, r.top - 50),
      left: Math.max(8, Math.min(r.left, window.innerWidth - 560)),
    });
    setWInput(String(Math.round(img.offsetWidth || r.width)));
  }, [img]);

  useEffect(() => {
    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [reposition]);

  // ── Image sizing ──
  const setW = (w: string) => {
    img.style.width = w; img.style.maxWidth = '100%'; img.style.height = 'auto';
    sync(); setTimeout(reposition, 16);
  };

  // ── Image float alignment ──
  const setImgAlign = (a: 'left' | 'center' | 'right') => {
    img.style.cssFloat = ''; img.style.display = 'block';
    img.style.marginLeft = ''; img.style.marginRight = ''; img.style.margin = '10px 0';
    if (a === 'left') { img.style.cssFloat = 'left'; img.style.margin = '4px 16px 8px 0'; }
    else if (a === 'right') { img.style.cssFloat = 'right'; img.style.margin = '4px 0 8px 16px'; }
    else { img.style.marginLeft = 'auto'; img.style.marginRight = 'auto'; }
    sync(); setTimeout(reposition, 16);
  };

  // ── Text insertion above/below ──
  const insertTextAround = (before: boolean) => {
    const anchor = img.closest('.img-ov-wrap') ?? img;
    const p = document.createElement('p');
    p.innerHTML = '&#8203;';
    if (before) anchor.parentNode!.insertBefore(p, anchor);
    else anchor.parentNode!.insertBefore(p, anchor.nextSibling);
    const range = document.createRange();
    range.setStart(p.firstChild!, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges(); sel?.addRange(range);
    editorEl.focus();
    onClose();
  };

  // ── Overlay helpers ──
  const applyOvStyles = (el: HTMLElement, pos: string, align: string, bg: boolean) => {
    const base = 'position:absolute;left:0;right:0;color:#fff;font-size:20px;font-weight:700;font-family:Arial,sans-serif;line-height:1.3;outline:none;min-height:40px;';
    const bgCss = bg
      ? pos === 'top'    ? 'background:linear-gradient(to bottom,rgba(0,0,0,.72),transparent);'
      : pos === 'middle' ? 'background:rgba(0,0,0,.45);'
      :                    'background:linear-gradient(to bottom,transparent,rgba(0,0,0,.72));'
      : 'background:transparent;';
    if (pos === 'top') {
      el.style.cssText = base + `top:0;bottom:auto;padding:18px 20px 36px;${bgCss}text-align:${align};`;
    } else if (pos === 'middle') {
      el.style.cssText = base + `top:50%;bottom:auto;transform:translateY(-50%);padding:16px 20px;${bgCss}text-align:${align};`;
    } else {
      el.style.cssText = base + `bottom:0;top:auto;padding:36px 20px 18px;${bgCss}text-align:${align};`;
    }
  };

  const addOverlay = () => {
    if (img.closest('.img-ov-wrap')) {
      (img.closest('.img-ov-wrap')!.querySelector('.img-ov-text') as HTMLElement | null)?.focus();
      return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'img-ov-wrap';
    wrap.style.cssText = 'position:relative;display:block;margin:10px 0;';
    img.replaceWith(wrap);
    img.style.cssText = 'width:100%;height:auto;display:block;border-radius:6px;cursor:pointer;';
    wrap.appendChild(img);
    const ov = document.createElement('div');
    ov.className = 'img-ov-text';
    ov.contentEditable = 'true';
    ov.setAttribute('data-ov-pos', 'bottom');
    ov.setAttribute('data-ov-align', 'left');
    ov.setAttribute('data-ov-bg', 'on');
    applyOvStyles(ov, 'bottom', 'left', true);
    ov.textContent = 'Your headline here';
    wrap.appendChild(ov);
    const after = document.createElement('p');
    after.innerHTML = '<br>';
    if (wrap.parentNode) wrap.parentNode.insertBefore(after, wrap.nextSibling);
    sync();
    setTimeout(() => { ov.focus(); }, 50);
  };

  // Derive current overlay state from DOM (must come before functions that use these values)
  const ovEl = img.closest('.img-ov-wrap')?.querySelector('.img-ov-text') as HTMLElement | null;
  const hasOverlay = !!ovEl;
  const ovPos = (ovEl?.getAttribute('data-ov-pos') ?? 'bottom') as 'top' | 'middle' | 'bottom';
  const ovAlign = (ovEl?.getAttribute('data-ov-align') ?? 'left') as 'left' | 'center' | 'right';
  const ovBg = ovEl?.getAttribute('data-ov-bg') !== 'off';
  const fl = img.style.cssFloat as string;
  const imgAlign = fl === 'left' ? 'left' : fl === 'right' ? 'right' : 'center';

  const setOvPos = (p: 'top' | 'middle' | 'bottom') => {
    if (!ovEl) return;
    ovEl.setAttribute('data-ov-pos', p);
    applyOvStyles(ovEl, p, ovAlign, ovBg);
    sync();
  };

  const setOvAlign = (a: 'left' | 'center' | 'right') => {
    if (!ovEl) return;
    ovEl.setAttribute('data-ov-align', a);
    applyOvStyles(ovEl, ovPos, a, ovBg);
    sync();
  };

  const toggleOvBg = () => {
    if (!ovEl) return;
    const next = !ovBg;
    ovEl.setAttribute('data-ov-bg', next ? 'on' : 'off');
    applyOvStyles(ovEl, ovPos, ovAlign, next);
    sync();
  };

  const removeOverlay = () => {
    const wrap = img.closest('.img-ov-wrap');
    if (!wrap) return;
    wrap.replaceWith(img);
    img.style.cssText = 'max-width:100%;height:auto;border-radius:6px;margin:10px 0;display:block;cursor:pointer;';
    sync();
  };

  const del = () => {
    (img.closest('.img-ov-wrap') ?? img).remove();
    sync(); onClose();
  };

  return (
    <div className="img-toolbar" style={{ position: 'fixed', top: tbPos.top, left: tbPos.left, zIndex: 9999 }}
      data-img-toolbar="1" onMouseDown={e => e.preventDefault()}>
      <button className="img-tb-btn" title="Add text above" onClick={() => insertTextAround(true)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
        Above
      </button>
      <button className="img-tb-btn" title="Add text below" onClick={() => insertTextAround(false)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        Below
      </button>
      <div className="img-tb-sep" />
      {(['25%','50%','75%','100%'] as const).map(w => (
        <button key={w} className="img-tb-btn" onClick={() => setW(w)}>{w === '100%' ? 'Full' : w}</button>
      ))}
      <div className="img-tb-w">
        <input type="number" className="img-tb-inp" value={wInput} min={10} max={1200}
          onChange={e => setWInput(e.target.value)}
          onBlur={() => { const n = parseInt(wInput); if (n > 0) setW(n + 'px'); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const n = parseInt(wInput); if (n > 0) setW(n + 'px'); } }}
        />
        <span className="img-tb-unit">px</span>
      </div>
      <div className="img-tb-sep" />
      {(['left','center','right'] as const).map(a => (
        <button key={a} className={`img-tb-btn${imgAlign === a ? ' img-tb-active' : ''}`} onClick={() => setImgAlign(a)} title={`Image align ${a}`}>
          {a === 'left'   && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="19" y2="18"/></svg>}
          {a === 'center' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>}
          {a === 'right'  && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="5" y1="18" x2="21" y2="18"/></svg>}
        </button>
      ))}
      <div className="img-tb-sep" />

      {/* ── Overlay controls ── */}
      {!hasOverlay ? (
        <button className="img-tb-btn" onClick={addOverlay} title="Add text overlay on image">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="2" width="20" height="20" rx="3"/>
            <line x1="7" y1="16" x2="17" y2="16"/><line x1="7" y1="12" x2="14" y2="12"/>
          </svg>
          Overlay
        </button>
      ) : (
        <>
          <span className="img-tb-label">Overlay:</span>
          {(['top','middle','bottom'] as const).map(p => (
            <button key={p} className={`img-tb-btn${ovPos === p ? ' img-tb-active' : ''}`} onClick={() => setOvPos(p)} title={`Text at ${p}`}>
              {p === 'top'    && <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="1" width="14" height="14" rx="2"/><line x1="3" y1="5" x2="13" y2="5"/><line x1="3" y1="8" x2="9" y2="8"/></svg>}
              {p === 'middle' && <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="1" width="14" height="14" rx="2"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="3" y1="11" x2="9" y2="11"/></svg>}
              {p === 'bottom' && <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="1" width="14" height="14" rx="2"/><line x1="3" y1="11" x2="13" y2="11"/><line x1="3" y1="8" x2="9" y2="8"/></svg>}
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <div className="img-tb-sep" />
          {(['left','center','right'] as const).map(a => (
            <button key={a} className={`img-tb-btn${ovAlign === a ? ' img-tb-active' : ''}`} onClick={() => setOvAlign(a)} title={`Text align ${a}`}>
              {a === 'left'   && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="19" y2="18"/></svg>}
              {a === 'center' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>}
              {a === 'right'  && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="5" y1="18" x2="21" y2="18"/></svg>}
            </button>
          ))}
          <div className="img-tb-sep" />
          <button className={`img-tb-btn${ovBg ? ' img-tb-active' : ''}`} onClick={toggleOvBg} title="Toggle background gradient">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" strokeWidth="1.6" strokeLinecap="round">
              <defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="rgba(0,0,0,.7)"/><stop offset="100%" stopColor="transparent"/></linearGradient></defs>
              <rect x="1" y="1" width="14" height="14" rx="2" fill={ovBg ? 'url(#grad)' : 'none'} stroke="currentColor"/>
              <line x1="6" y1="5" x2="11" y2="5" stroke="currentColor"/><line x1="6" y1="8" x2="10" y2="8" stroke="currentColor"/>
            </svg>
            BG
          </button>
          <button className="img-tb-btn img-tb-del" onClick={removeOverlay} title="Remove overlay">
            <svg width="11" height="11" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
            Overlay
          </button>
        </>
      )}
      <div className="img-tb-sep" />
      <button className="img-tb-btn img-tb-del" onClick={del} title="Delete image">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>
  );
}

// ── Rich text editor ──────────────────────────────────────────────────────────

interface RichEditorProps {
  initialHtml?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function RichEditor({ initialHtml, onChange, placeholder }: RichEditorProps) {
  const editorRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const [showColors,      setShowColors]      = useState(false);
  const [showHighlights,  setShowHighlights]  = useState(false);
  const [currentColor,    setCurrentColor]    = useState('#dc2626');
  const [currentHL,       setCurrentHL]       = useState('#fef08a');
  const [formats, setFormats] = useState({ bold: false, italic: false, underline: false, strikeThrough: false });
  const [selImg,          setSelImg]          = useState<HTMLImageElement | null>(null);
  const [showLinkDialog,  setShowLinkDialog]  = useState(false);
  const [linkUrl,         setLinkUrl]         = useState('');
  const [showInsertMenu,  setShowInsertMenu]  = useState(false);
  const [colorHexInput,   setColorHexInput]   = useState('#dc2626');
  const [hlHexInput,      setHlHexInput]      = useState('#fef08a');

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHtml ?? '';
      if (initialHtml) onChange(initialHtml);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncFormats = useCallback(() => {
    setFormats({
      bold:          document.queryCommandState('bold'),
      italic:        document.queryCommandState('italic'),
      underline:     document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
    });
  }, []);

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    syncFormats();
    onChange(editorRef.current?.innerHTML ?? '');
  }, [onChange, syncFormats]);

  // Save & restore selection (needed before file picker opens)
  const saveRange = useCallback(() => {
    const sel = window.getSelection();
    savedRangeRef.current = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
  }, []);

  const restoreRange = useCallback(() => {
    if (!savedRangeRef.current) return;
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(savedRangeRef.current); }
  }, []);

  // Text color
  const applyColor = useCallback((color: string) => {
    restoreRange();
    exec('foreColor', color);
    setCurrentColor(color);
    setColorHexInput(color);
    setShowColors(false);
  }, [exec, restoreRange]);

  // Background / highlight color
  const applyHighlight = useCallback((color: string) => {
    restoreRange();
    if (color === 'REMOVE') {
      exec('hiliteColor', 'transparent');
    } else {
      exec('hiliteColor', color);
      setCurrentHL(color);
      setHlHexInput(color);
    }
    setShowHighlights(false);
  }, [exec, restoreRange]);

  // Image insertion — uses execCommand so Ctrl+Z undo works natively
  const insertImageNode = useCallback((src: string, name: string) => {
    if (!editorRef.current) return;
    restoreRange();
    editorRef.current.focus();
    const esc = name.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    document.execCommand('insertHTML', false,
      `<img src="${src}" alt="${esc}" style="max-width:100%;height:auto;border-radius:6px;margin:10px 0;display:block;cursor:pointer;">`
    );
    onChange(editorRef.current.innerHTML);
  }, [restoreRange, onChange]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB.'); return; }

    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
      if (src) insertImageNode(src, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset so same file can be picked again
  }, [insertImageNode]);

  // Image click/deselect handlers
  const handleImgClick = useCallback((e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.tagName === 'IMG') {
      // deselect previous
      editorRef.current?.querySelectorAll('img.img-sel').forEach(i => i.classList.remove('img-sel'));
      t.classList.add('img-sel');
      setSelImg(t as HTMLImageElement);
    }
  }, []);

  const handleImgDeselect = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName !== 'IMG' && !(e.target as HTMLElement).closest('.img-toolbar')) {
      editorRef.current?.querySelectorAll('img.img-sel').forEach(i => i.classList.remove('img-sel'));
      setSelImg(null);
    }
  }, []);

  // Link dialog
  const applyLink = useCallback(() => {
    restoreRange();
    editorRef.current?.focus();
    if (linkUrl.trim()) {
      const url = linkUrl.startsWith('http') ? linkUrl : 'https://' + linkUrl;
      document.execCommand('createLink', false, url);
    }
    setShowLinkDialog(false);
    setLinkUrl('');
    onChange(editorRef.current?.innerHTML ?? '');
  }, [restoreRange, linkUrl, onChange]);

  // Insert styled block
  const insertBlock = useCallback((type: 'steps' | 'callout' | 'quote' | 'cta' | 'divider') => {
    editorRef.current?.focus();
    setShowInsertMenu(false);
    const html: Record<string, string> = {
      steps: `<div style="margin:16px 0;">
<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
  <span style="display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;background:#4f46e5;color:#fff;font-weight:700;font-size:13px;border-radius:50%;">1</span>
  <div style="padding-top:4px;"><strong>First step</strong><br><span style="color:#6b7280;font-size:14px;">Describe what to do here.</span></div>
</div>
<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
  <span style="display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;background:#4f46e5;color:#fff;font-weight:700;font-size:13px;border-radius:50%;">2</span>
  <div style="padding-top:4px;"><strong>Second step</strong><br><span style="color:#6b7280;font-size:14px;">Describe what to do here.</span></div>
</div>
<div style="display:flex;align-items:flex-start;gap:12px;">
  <span style="display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;background:#4f46e5;color:#fff;font-weight:700;font-size:13px;border-radius:50%;">3</span>
  <div style="padding-top:4px;"><strong>Third step</strong><br><span style="color:#6b7280;font-size:14px;">Describe what to do here.</span></div>
</div></div>`,
      callout: `<div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;padding:14px 18px;margin:16px 0;"><strong>💡 Note</strong><br><span style="color:#92400e;font-size:14px;">Add your callout message here.</span></div>`,
      quote: `<blockquote style="border-left:4px solid #4f46e5;margin:16px 0;padding:12px 20px;background:#f5f3ff;border-radius:0 6px 6px 0;"><p style="margin:0;font-style:italic;color:#3730a3;font-size:15px;">"Your inspirational quote goes here."</p><footer style="margin-top:8px;font-size:13px;color:#6b7280;">— Author name</footer></blockquote>`,
      cta: `<div style="text-align:center;margin:24px 0;"><a href="#" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;font-size:15px;padding:12px 32px;border-radius:8px;text-decoration:none;">Click here to get started →</a></div>`,
      divider: `<hr style="border:none;border-top:2px solid #e5e7eb;margin:24px 0;">`,
    };
    document.execCommand('insertHTML', false, html[type]);
    onChange(editorRef.current?.innerHTML ?? '');
  }, [onChange]);

  // Close popover on outside click
  useEffect(() => {
    if (!showColors && !showHighlights && !showInsertMenu) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.cp-wrap') && !(e.target as HTMLElement).closest('.insert-menu-wrap')) {
        setShowColors(false);
        setShowHighlights(false);
        setShowInsertMenu(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showColors, showHighlights, showInsertMenu]);

  const Btn = ({ active, title, onMD, children }: {
    active?: boolean; title: string;
    onMD: (e: React.MouseEvent) => void;
    children: React.ReactNode;
  }) => (
    <button type="button" className={`tb-btn${active ? ' tb-active' : ''}`} title={title} onMouseDown={onMD}>
      {children}
    </button>
  );

  return (
    <>
      <div className="toolbar">
        {/* ── Format ── */}
        <Btn active={formats.bold} title="Bold (⌘B)" onMD={e => { e.preventDefault(); exec('bold'); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
        </Btn>
        <Btn active={formats.italic} title="Italic (⌘I)" onMD={e => { e.preventDefault(); exec('italic'); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>
          </svg>
        </Btn>
        <Btn active={formats.underline} title="Underline (⌘U)" onMD={e => { e.preventDefault(); exec('underline'); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/><line x1="4" y1="21" x2="20" y2="21"/>
          </svg>
        </Btn>
        <Btn active={formats.strikeThrough} title="Strikethrough" onMD={e => { e.preventDefault(); exec('strikeThrough'); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M16 4H9a3 3 0 00-2.83 4"/><path d="M14 12a4 4 0 010 8H6"/><line x1="4" y1="12" x2="20" y2="12"/>
          </svg>
        </Btn>

        <div className="tb-sep" />

        {/* ── Text color ── */}
        <div className="cp-wrap">
          <button type="button" className="tb-btn tb-color-btn" title="Text color"
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); if (!showColors) { saveRange(); setColorHexInput(currentColor); } setShowColors(s => !s); setShowHighlights(false); }}>
            <span className="tb-color-a">A</span>
            <span className="tb-color-bar" style={{ background: currentColor }} />
          </button>
          {showColors && (
            <div className="cp-popover">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" className="cp-swatch" style={{ background: c }} title={c}
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); applyColor(c); }} />
              ))}
              <div className="cp-hex-row">
                <input type="color" className="cp-native-picker" value={colorHexInput}
                  onMouseDown={() => saveRange()}
                  onChange={e => {
                    const v = e.target.value;
                    setColorHexInput(v);
                    restoreRange();
                    exec('foreColor', v);
                    setCurrentColor(v);
                  }}
                />
                <span className="cp-hash">#</span>
                <input type="text" className="cp-hex-inp" value={colorHexInput.replace('#', '')}
                  placeholder="000000" maxLength={6}
                  onMouseDown={e => e.stopPropagation()}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '');
                    setColorHexInput('#' + raw);
                    if (raw.length === 6) { restoreRange(); exec('foreColor', '#' + raw); setCurrentColor('#' + raw); }
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setShowColors(false); } if (e.key === 'Escape') setShowColors(false); }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Background / highlight color ── */}
        <div className="cp-wrap">
          <button type="button" className="tb-btn tb-color-btn" title="Highlight / background color"
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); if (!showHighlights) { saveRange(); setHlHexInput(currentHL); } setShowHighlights(s => !s); setShowColors(false); }}>
            <span className="tb-hl-icon">
              <svg width="12" height="11" viewBox="0 0 14 12" fill="none">
                <path d="M2 10h10M4 7.5L7 1l3 6.5H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="tb-color-bar" style={{ background: currentHL }} />
          </button>
          {showHighlights && (
            <div className="cp-popover cp-hl-popover">
              {HIGHLIGHT_COLORS.map(c => (
                c === 'REMOVE'
                  ? <button key="remove" type="button" className="cp-swatch cp-swatch-remove" title="Remove highlight"
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); applyHighlight('REMOVE'); }}>
                      <svg width="9" height="9" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
                      </svg>
                    </button>
                  : <button key={c} type="button" className="cp-swatch"
                      style={{ background: c, border: (c === '#ffffff' || c === '#f3f4f6') ? '1.5px solid #d1d5db' : '1.5px solid rgba(0,0,0,.06)' }}
                      title={c}
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); applyHighlight(c); }} />
              ))}
              <div className="cp-hex-row">
                <input type="color" className="cp-native-picker" value={hlHexInput.startsWith('#') && hlHexInput.length === 7 ? hlHexInput : '#fef08a'}
                  onMouseDown={() => saveRange()}
                  onChange={e => {
                    const v = e.target.value;
                    setHlHexInput(v);
                    restoreRange();
                    exec('hiliteColor', v);
                    setCurrentHL(v);
                  }}
                />
                <span className="cp-hash">#</span>
                <input type="text" className="cp-hex-inp" value={hlHexInput.replace('#', '')}
                  placeholder="fef08a" maxLength={6}
                  onMouseDown={e => e.stopPropagation()}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '');
                    setHlHexInput('#' + raw);
                    if (raw.length === 6) { restoreRange(); exec('hiliteColor', '#' + raw); setCurrentHL('#' + raw); }
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setShowHighlights(false); } if (e.key === 'Escape') setShowHighlights(false); }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="tb-sep" />

        {/* ── Alignment ── */}
        <Btn title="Align left" onMD={e => { e.preventDefault(); exec('justifyLeft'); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="19" y2="18"/>
          </svg>
        </Btn>
        <Btn title="Align center" onMD={e => { e.preventDefault(); exec('justifyCenter'); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </Btn>

        <div className="tb-sep" />

        {/* ── Lists ── */}
        <Btn title="Bullet list" onMD={e => { e.preventDefault(); exec('insertUnorderedList'); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
            <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
        </Btn>
        <Btn title="Numbered list" onMD={e => { e.preventDefault(); exec('insertOrderedList'); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
            <path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
          </svg>
        </Btn>

        <div className="tb-sep" />

        {/* ── Link ── */}
        <Btn title="Insert link (select text first)" onMD={e => {
          e.preventDefault();
          const sel = window.getSelection();
          if (!sel || sel.toString().trim() === '') return;
          saveRange();
          setShowLinkDialog(true);
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
          </svg>
        </Btn>

        {/* ── Insert block ── */}
        <div className="insert-menu-wrap">
          <button type="button" className="tb-btn" title="Insert styled block"
            onMouseDown={e => { e.preventDefault(); setShowInsertMenu(s => !s); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          {showInsertMenu && (
            <div className="insert-menu">
              {([
                { key: 'steps',   label: '① Numbered steps',  desc: 'Styled circle badge steps' },
                { key: 'callout', label: '💡 Callout box',    desc: 'Highlighted note or tip' },
                { key: 'quote',   label: '❝ Pull quote',      desc: 'Styled blockquote' },
                { key: 'cta',     label: '→ CTA button',      desc: 'Centered call-to-action' },
                { key: 'divider', label: '— Divider',         desc: 'Horizontal rule' },
              ] as const).map(({ key, label, desc }) => (
                <button key={key} className="im-item" onMouseDown={e => { e.preventDefault(); insertBlock(key); }}>
                  <span className="im-label">{label}</span>
                  <span className="im-desc">{desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Image upload ── */}
        <Btn title="Insert image (JPG, PNG, GIF, WebP — max 5 MB)" onMD={e => { e.preventDefault(); saveRange(); fileInputRef.current?.click(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </Btn>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        style={{ display: 'none' }} onChange={handleFileChange} />

      <div className="rich-editor-wrap" onMouseDown={handleImgDeselect}>
        <div className="rich-editor-hint">✏ Click to edit</div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="rich-editor"
          onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
          onKeyUp={syncFormats}
          onMouseUp={syncFormats}
          onFocus={syncFormats}
          onClick={handleImgClick}
          data-placeholder={placeholder}
        />
        {selImg && (
          <ImageToolbar
            img={selImg}
            editorEl={editorRef.current!}
            onChange={() => onChange(editorRef.current?.innerHTML ?? '')}
            onClose={() => { selImg.classList.remove('img-sel'); setSelImg(null); }}
          />
        )}
      </div>

      {/* Link dialog */}
      {showLinkDialog && (
        <div className="link-dialog-backdrop" onMouseDown={() => { setShowLinkDialog(false); setLinkUrl(''); }}>
          <div className="link-dialog" onMouseDown={e => e.stopPropagation()}>
            <div className="ld-title">Insert link</div>
            <input
              className="ld-input"
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              autoFocus
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } if (e.key === 'Escape') { setShowLinkDialog(false); setLinkUrl(''); } }}
            />
            <div className="ld-actions">
              <button className="ld-btn ld-cancel" onClick={() => { setShowLinkDialog(false); setLinkUrl(''); }}>Cancel</button>
              <button className="ld-btn ld-apply" onClick={applyLink}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#d93025','#e37400','#188038','#1a73e8','#a142f4','#00897b','#c2185b','#0288d1'];
function avatarBg(name: string) {
  return AVATAR_COLORS[(name.charCodeAt(0) || 65) % AVATAR_COLORS.length]!;
}

interface PreviewProps { subject: string; fromName: string; fromEmail: string; bodyHtml: string; }

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const ReplyIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/>
  </svg>
);
const ForwardIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 014-4h12"/>
  </svg>
);
const MoreIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
  </svg>
);
const BackIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

// ── Gmail Desktop preview ─────────────────────────────────────────────────────

function GmailDesktop({ subject, fromName, fromEmail, bodyHtml }: PreviewProps) {
  const initial = (fromName[0] ?? 'A').toUpperCase();
  const color = avatarBg(fromName || 'A');
  const addr = (fromEmail || 'hello') + '@acme.co';

  return (
    <div className="gd-wrap">

      {/* ── Email thread (full width, no sidebar) ── */}
      <div className="gd-thread-col">

        {/* Thread toolbar */}
        <div className="gd-thread-bar">
          <div className="gd-tb-left">
            <button className="gd-tb-btn"><BackIcon /></button>
            <div className="gd-tb-sep" />
            <button className="gd-tb-btn" title="Archive">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            </button>
            <button className="gd-tb-btn" title="Delete">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
            <button className="gd-tb-btn" title="Mark unread">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 6l-10 7L2 6"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
            </button>
            <button className="gd-tb-btn" title="More actions"><MoreIcon size={17} /></button>
          </div>
          <div className="gd-tb-right">
            <span className="gd-page">1–1 of 1</span>
            <button className="gd-tb-btn" title="Newer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button className="gd-tb-btn" title="Older">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {/* Email card */}
        <div className="gd-card">
          <div className="gd-subject-row">
            <h2 className="gd-subject">{subject || 'Your subject line'}</h2>
            <span className="gd-chip">Inbox</span>
            <button className="gd-tb-btn gd-star"><StarIcon /></button>
          </div>

          <div className="gd-sender-row">
            <div className="gd-av" style={{ background: color }}>{initial}</div>
            <div className="gd-sender-info">
              <div className="gd-sender-line1">
                <strong className="gd-sender-name">{fromName || 'Sender name'}</strong>
                <span className="gd-sender-addr">&lt;{addr}&gt;</span>
              </div>
              <div className="gd-to-me">to me <span className="gd-caret">▾</span></div>
            </div>
            <div className="gd-sender-right">
              <span className="gd-send-time">Jun 10, 2026, 10:24 AM</span>
              <button className="gd-tb-btn"><ReplyIcon /></button>
              <button className="gd-tb-btn"><MoreIcon /></button>
            </div>
          </div>

          <div className="gd-body">
            {bodyHtml ? (
              <div className="ep-html" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            ) : (
              <p className="gd-empty">Your email body will appear here as you type…</p>
            )}
          </div>

          <div className="gd-reply-bar">
            <button className="gd-reply-btn"><ReplyIcon /> Reply</button>
            <button className="gd-reply-btn"><ForwardIcon /> Forward</button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Gmail Mobile preview (inside phone shell) ─────────────────────────────────

function PhoneFrame({ subject, fromName, fromEmail, bodyHtml }: PreviewProps) {
  const initial = (fromName[0] ?? 'A').toUpperCase();
  const color = avatarBg(fromName || 'A');
  const addr = (fromEmail || 'hello') + '@acme.co';
  const sub = subject || 'Your subject line';

  return (
    <div className="phone-wrap">
      <div className="phone-body">

        {/* Dynamic island */}
        <div className="phone-island-row"><div className="phone-island" /></div>

        {/* iOS status bar */}
        <div className="phone-status-bar">
          <span className="phone-time">9:41</span>
          <div className="phone-status-icons">
            <svg width="18" height="13" viewBox="0 0 15 11" fill="currentColor">
              <rect x="0" y="7" width="3" height="4" rx=".5" opacity=".4"/>
              <rect x="4" y="5" width="3" height="6" rx=".5" opacity=".6"/>
              <rect x="8" y="3" width="3" height="8" rx=".5" opacity=".8"/>
              <rect x="12" y="0" width="3" height="11" rx=".5"/>
            </svg>
            <svg width="18" height="13" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M7.5 9.5h.01"/>
              <path d="M5 7.2a3.5 3.5 0 015 0" opacity=".7"/>
              <path d="M2.5 4.7A7 7 0 0112.5 4.7" opacity=".45"/>
            </svg>
            <svg width="26" height="13" viewBox="0 0 22 11" fill="currentColor">
              <rect x="0" y="1" width="19" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1"/>
              <rect x="19.5" y="3.5" width="2" height="4" rx="1"/>
              <rect x="1.5" y="2.5" width="14" height="6" rx="1"/>
            </svg>
          </div>
        </div>

        {/* Gmail mobile app bar */}
        <div className="gm-appbar">
          <button className="gm-ab-btn"><BackIcon size={20} /></button>
          <span className="gm-ab-title">{sub}</span>
          <button className="gm-ab-btn"><StarIcon /></button>
          <button className="gm-ab-btn"><MoreIcon size={18} /></button>
        </div>

        {/* Scrollable email thread */}
        <div className="phone-scroll">

          {/* Subject */}
          <div className="gm-subject">{sub}</div>

          {/* Sender row */}
          <div className="gm-sender-row">
            <div className="gm-av" style={{ background: color }}>{initial}</div>
            <div className="gm-sender-info">
              <div className="gm-sender-top">
                <span className="gm-sender-name">{fromName || 'Sender'}</span>
                <span className="gm-send-time">Jun 7</span>
              </div>
              <div className="gm-to-me">to me <span className="gm-caret">▾</span></div>
              <div className="gm-sender-addr">{addr}</div>
            </div>
            <div className="gm-row-actions">
              <button className="gm-ab-btn"><ReplyIcon size={14} /></button>
              <button className="gm-ab-btn"><MoreIcon size={14} /></button>
            </div>
          </div>

          {/* Body */}
          {bodyHtml ? (
            <div className="gm-body ep-html" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          ) : (
            <div className="gm-empty">Your email body will appear here as you type…</div>
          )}

        </div>

        {/* Reply / Forward footer */}
        <div className="gm-reply-bar">
          <button className="gm-reply-btn"><ReplyIcon size={16} /><span>Reply</span></button>
          <button className="gm-reply-btn"><ReplyIcon size={16} /><span>Reply all</span></button>
          <button className="gm-reply-btn"><ForwardIcon size={16} /><span>Forward</span></button>
        </div>

        {/* Home indicator */}
        <div className="phone-home-bar"><div className="phone-home-indicator" /></div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CampaignComposerPage() {
  const navigate = useNavigate();
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();

  const [step, setStep] = useState<Step>(1);
  const [showTemplatePicker, setShowTemplatePicker] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const [form, setForm] = useState({ name: '', fromName: '', fromEmail: '', subject: '', body: '' });
  const [selectedSegId, setSelectedSegId] = useState('s1');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sent, setSent] = useState(false);

  const selectedSeg = SEGMENTS.find(s => s.id === selectedSegId) ?? SEGMENTS[0]!;

  const update = useCallback((field: keyof typeof form, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  }, []);

  function handleSelectTemplate(t: EmailTemplate) {
    setSelectedTemplate(t);
    setShowTemplatePicker(false);
    // Update body and remount the editor so it picks up the new initialHtml
    setForm(f => ({ ...f, body: t.html }));
    setEditorKey(k => k + 1);
  }

  const stepLabels = ['Content', 'Audience', 'Schedule', 'Review'];

  function goTo(n: Step) {
    setStep(n);
    document.getElementById('viewWrap')?.scrollTo(0, 0);
  }

  function plainText(html: string) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent ?? '';
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
                <b>{form.name || 'Your campaign'}</b>{' '}
                {scheduleMode === 'now' ? 'is now fanning out to' : 'will send to'}{' '}
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
      <Topbar crumb="Campaigns" title={step === 4 ? 'Review & send' : 'New campaign'} onMenuOpen={onMenuOpen} />
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

            {/* ── Step 1: Content ── */}
            {step === 1 && (
              <div className="step-panel active">

                {/* Template section */}
                {showTemplatePicker ? (
                  <div className="field">
                    <label>Choose a template</label>
                    <TemplatePicker onSelect={handleSelectTemplate} />
                  </div>
                ) : (
                  <div className="tpl-selected-bar">
                    <div className="tpl-selected-thumb">
                      <TemplateThumbnail t={selectedTemplate!} />
                    </div>
                    <div className="tpl-selected-info">
                      <div className="tpl-selected-name">{selectedTemplate!.name}</div>
                      <div className="tpl-selected-cat">{selectedTemplate!.category}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowTemplatePicker(true)}>
                      Change template
                    </button>
                  </div>
                )}

                {!showTemplatePicker && (
                  <>
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
                      <RichEditor
                        key={editorKey}
                        initialHtml={form.body}
                        onChange={html => update('body', html)}
                        placeholder="Hi {{first_name}},&#10;&#10;Your message here…"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Step 2: Audience ── */}
            {step === 2 && (
              <div className="step-panel active">
                <div className="field">
                  <label>Choose a segment</label>
                  <div className="seg-pick">
                    {SEGMENTS.map(seg => (
                      <button key={seg.id} className={`seg-card${selectedSegId === seg.id ? ' selected' : ''}`} onClick={() => setSelectedSegId(seg.id)}>
                        <span className="seg-radio" />
                        <span className="seg-body">
                          <span className="seg-name">{seg.name}</span>
                          <span className="seg-desc">{seg.desc}</span>
                        </span>
                        <span className="seg-count">{seg.count.toLocaleString()}<small>contacts</small></span>
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

            {/* ── Step 3: Schedule ── */}
            {step === 3 && (
              <div className="step-panel active">
                <div className="field">
                  <label>When to send</label>
                  <div className="radio-cards">
                    {[
                      { id: 'now', title: 'Send now', desc: 'Queued immediately on launch' },
                      { id: 'later', title: 'Schedule for later', desc: 'Pick a date and time' },
                    ].map(opt => (
                      <div key={opt.id} className={`radio-card${scheduleMode === opt.id ? ' selected' : ''}`} onClick={() => setScheduleMode(opt.id as 'now' | 'later')}>
                        <div className="rc-top"><span className="rc-dot" /><span className="rc-name">{opt.title}</span></div>
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
                    <span style={{ fontFamily: 'var(--display)', fontWeight: 600, color: 'var(--ink)' }}>{selectedSeg.count.toLocaleString()}</span>{' contacts ≈ '}
                    <span>{selectedSeg.count <= 2000 ? `~${Math.ceil(selectedSeg.count / 2000 * 60)} minutes` : `~${(selectedSeg.count / 2000).toFixed(1)} hours`}</span>{' at 2,000/hour'}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Review ── */}
            {step === 4 && (
              <div className="step-panel active">
                <div className="card card-pad">
                  <div className="review-list">
                    {[
                      { k: 'Campaign', v: form.name || '—', sub: null, goto: 1 },
                      { k: 'Template', v: selectedTemplate?.name ?? 'Blank', sub: selectedTemplate?.category ?? null, goto: 1 },
                      { k: 'Subject', v: resolveMergeTags(form.subject) || '—', sub: null, goto: 1 },
                      { k: 'From', v: `${form.fromName} <${form.fromEmail}@acme.co>`, sub: null, goto: 1 },
                      { k: 'Body', v: form.body ? `${plainText(form.body).slice(0, 70).trim()}…` : '—', sub: null, goto: 1 },
                      { k: 'Audience', v: selectedSeg.name, sub: `${selectedSeg.count.toLocaleString()} recipients · suppressions excluded`, goto: 2 },
                      { k: 'Delivery', v: scheduleMode === 'now' ? 'Send now' : 'Scheduled', sub: scheduleMode === 'later' ? scheduledAt : 'Queued immediately on launch', goto: 3 },
                    ].map(row => (
                      <div key={row.k} className="review-row">
                        <span className="rk">{row.k}</span>
                        <span className="rv">{row.v}{row.sub && <span className="rsub">{row.sub}</span>}</span>
                        <button className="edit-link" onClick={() => goTo(row.goto as Step)}>Edit</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer nav */}
            <div className="composer-foot">
              <button
                className="btn btn-ghost"
                style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
                onClick={() => goTo((step - 1) as Step)}
              >← Back</button>
              <div className="spacer" />
              {step < 4 && (
                <button
                  className="btn btn-primary"
                  disabled={step === 1 && showTemplatePicker}
                  onClick={() => goTo((step + 1) as Step)}
                >
                  Continue →
                </button>
              )}
              {step === 4 && (
                <button className="btn btn-coral" onClick={() => setSent(true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
                  Send campaign
                </button>
              )}
            </div>
          </div>

          {/* Live email preview */}
          <div className="preview-col">
            <div className={`email-preview${previewMode === 'mobile' ? ' ep-mobile-mode' : ''}`}>

              {/* Bar — always shown */}
              <div className="ep-bar">
                {previewMode === 'desktop' && (
                  <div className="ep-dots"><span /><span /><span /></div>
                )}
                <div className="ep-toggle">
                  <button
                    className={`ep-toggle-btn${previewMode === 'desktop' ? ' active' : ''}`}
                    title="Desktop preview"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                    </svg>
                    <span>Desktop</span>
                  </button>
                  <button
                    className={`ep-toggle-btn${previewMode === 'mobile' ? ' active' : ''}`}
                    title="Mobile preview"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <svg width="12" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="5" y="2" width="14" height="20" rx="3"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
                    </svg>
                    <span>Mobile</span>
                  </button>
                </div>
                <span className="ept">Inbox preview</span>
              </div>

              {/* Desktop view — Gmail web */}
              {previewMode === 'desktop' && (
                <GmailDesktop
                  subject={resolveMergeTags(form.subject)}
                  fromName={form.fromName}
                  fromEmail={form.fromEmail}
                  bodyHtml={form.body ? resolveMergeTags(form.body) : ''}
                />
              )}

              {/* Mobile view */}
              {previewMode === 'mobile' && (
                <PhoneFrame
                  subject={resolveMergeTags(form.subject)}
                  fromName={form.fromName}
                  fromEmail={form.fromEmail}
                  bodyHtml={form.body ? resolveMergeTags(form.body) : ''}
                />
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
