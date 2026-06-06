import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  crumb: string;
  title: string;
  onMenuOpen?: () => void;
  actions?: React.ReactNode;
}

export function Topbar({ crumb, title, onMenuOpen, actions }: TopbarProps) {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <button className="icon-btn mobile-only" onClick={onMenuOpen} aria-label="Open menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>

      <div className="tb-title">
        <span className="tb-crumb">{crumb}</span>
        <h1>{title}</h1>
      </div>

      <div className="tb-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" placeholder="Search…" />
        <span className="kbd">⌘K</span>
      </div>

      <div className="tb-actions">
        {actions}
        <button className="icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span className="dot" />
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/campaigns/new')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          New campaign
        </button>
      </div>
    </header>
  );
}
