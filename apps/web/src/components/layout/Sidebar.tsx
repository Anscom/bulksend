import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspace.store.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { authApi } from '../../lib/api/auth.js';
import { campaignsApi } from '../../lib/api/campaigns.js';
import { contactsApi } from '../../lib/api/contacts.js';
import { segmentsApi } from '../../lib/api/segments.js';
import { analyticsApi } from '../../lib/api/analytics.js';
import { WorkspacePanel } from '../workspace/WorkspacePanel.js';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

const icons: Record<string, React.ReactNode> = {
  dashboard:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>,
  campaigns:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 6l-10 7L2 6"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>,
  contacts:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13A4 4 0 0119 7"/></svg>,
  segments:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>,
  analytics:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>,
  events:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>,
  settings:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-2.81 1.17V21a2 2 0 01-4 0v-.09A1.65 1.65 0 006 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 003.6 14"/></svg>,
  upgrade:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
};

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const clearWorkspace = useWorkspaceStore((s) => s.clear);
  const { email, name, clear: clearAuth } = useAuthStore();

  const [wsOpen, setWsOpen] = useState(false);
  const [campaignCount, setCampaignCount] = useState<number | null>(null);
  const [contactCount,  setContactCount]  = useState<number | null>(null);
  const [segmentCount,  setSegmentCount]  = useState<number | null>(null);
  const [sendsThisHour, setSendsThisHour] = useState(0);
  const [planLimit,     setPlanLimit]     = useState(workspace?.sendRatePerHour ?? 100);
  const [minutesLeft,   setMinutesLeft]   = useState(60 - new Date().getMinutes());

  useEffect(() => {
    // Fetch all nav counts in parallel
    Promise.all([
      campaignsApi.list(1, 1),
      contactsApi.list(1),
      segmentsApi.list(1, 1),
      analyticsApi.getUsage(),
    ]).then(([campaigns, contacts, segments, usage]) => {
      setCampaignCount(campaigns.total);
      setContactCount(contacts.total);
      setSegmentCount(segments.total);
      setSendsThisHour(usage.sendsThisHour);
      setPlanLimit(usage.planLimit);
      setMinutesLeft(usage.minutesUntilReset);
    }).catch(() => {});
  }, [location.pathname]); // refresh counts on navigation

  const currentView = location.pathname.split('/')[1] ?? 'dashboard';

  function go(view: string) {
    navigate(`/${view}`);
    onClose?.();
  }

  async function handleLogout() {
    try { await authApi.logout(); } catch { /* ignore if token already expired */ }
    clearAuth();
    clearWorkspace();
    navigate('/login');
  }

  const initials = (name ?? email ?? 'JL').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const wsInitial = (workspace?.name ?? 'A')[0]?.toUpperCase() ?? 'A';

  const remaining = Math.max(0, planLimit - sendsThisHour);
  const usagePct  = planLimit > 0 ? Math.min(100, Math.round((sendsThisHour / planLimit) * 100)) : 0;
  const isNearLimit = usagePct >= 80;

  const navItems = [
    {
      group: null,
      items: [
        { view: 'dashboard', label: 'Dashboard',  badge: null },
        { view: 'campaigns', label: 'Campaigns',  badge: campaignCount !== null ? formatCount(campaignCount) : null },
        { view: 'contacts',  label: 'Contacts',   badge: contactCount  !== null ? formatCount(contactCount)  : null },
        { view: 'segments',  label: 'Segments',   badge: segmentCount  !== null ? formatCount(segmentCount)  : null },
      ],
    },
    {
      group: 'Insights',
      items: [
        { view: 'analytics', label: 'Analytics',    badge: null },
        { view: 'events',    label: 'Event stream', badge: null },
      ],
    },
    {
      group: 'Workspace',
      items: [
        { view: 'settings', label: 'Settings',       badge: null },
        { view: 'upgrade',  label: 'Plans & Billing', badge: null },
      ],
    },
  ];

  return (
    <>
    {wsOpen && workspace && (
      <WorkspacePanel workspace={workspace} onClose={() => setWsOpen(false)} />
    )}
    <aside className="sidebar">
      <div className="sb-top">
        <div className="brand">
          <span className="brand-mark">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M2 12l19-9-9 19-2-8-8-2z" fill="#fff"/></svg>
          </span>
          BulkSend
        </div>
        <button className="ws-switch" onClick={() => workspace && setWsOpen(true)}>
          <span className="ws-avatar">{wsInitial}</span>
          <span className="ws-meta">
            <span className="wn">{workspace?.name ?? 'Workspace'}</span>
            <span className="wp">{workspace?.plan ?? 'Free'} · Members</span>
          </span>
          <span className="chev">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 9l4-4 4 4M8 15l4 4 4-4"/></svg>
          </span>
        </button>
      </div>

      <nav className="sb-nav">
        {navItems.map((group) => (
          <div key={group.group ?? 'main'} className="nav-group">
            {group.group && <div className="nav-label">{group.group}</div>}
            {group.items.map((item) => (
              <button
                key={item.view}
                className={`nav-item${currentView === item.view ? ' active' : ''}`}
                onClick={() => go(item.view)}
              >
                {icons[item.view]}
                {item.label}
                {item.badge && <span className="badge">{item.badge}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sb-bottom">
        <div className="usage">
          <div className="ut">
            <span className="ul">Send rate · this hour</span>
            <span className="uv">{sendsThisHour.toLocaleString()} / {planLimit.toLocaleString()}</span>
          </div>
          <div className="track">
            <div className="fill" style={{ width: `${usagePct}%`, background: isNearLimit ? 'var(--amber)' : undefined }} />
          </div>
          <div className="uh" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><b>{remaining.toLocaleString()}</b> remaining · resets in {minutesLeft}m</span>
            <button
              onClick={() => go('upgrade')}
              style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--indigo)', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'var(--mono)' }}
            >
              Upgrade ↑
            </button>
          </div>
        </div>
        <button className="user-chip" onClick={() => go('settings')}>
          <span className="avatar" style={{ background: 'var(--coral)' }}>{initials}</span>
          <span className="um">
            <span className="un">{name ?? 'User'}</span>
            <span className="ue">{email ?? ''}</span>
          </span>
        </button>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', marginTop: 6, padding: '8px 12px',
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 'var(--r)', color: 'var(--slate)', fontSize: 13,
            cursor: 'pointer', textAlign: 'center',
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
    </>
  );
}
