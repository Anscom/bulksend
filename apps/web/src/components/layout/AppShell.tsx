import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import '../../styles/app.css';

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className={`app${navOpen ? ' nav-open' : ''}`}>
      <div
        className="sb-backdrop"
        onClick={() => setNavOpen(false)}
        aria-hidden="true"
      />
      <Sidebar onClose={() => setNavOpen(false)} />
      <div className="main">
        <div className="view-wrap" id="viewWrap">
          <Outlet context={{ onMenuOpen: () => setNavOpen(true) }} />
        </div>
      </div>
    </div>
  );
}
