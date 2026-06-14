import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { useWorkspaceStore } from '../../stores/workspace.store.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { usersApi } from '../../lib/api/users.js';
import '../../styles/app.css';

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const workspace = useWorkspaceStore(s => s.workspace);
  const setWorkspace = useWorkspaceStore(s => s.setWorkspace);
  const setUser = useAuthStore(s => s.setUser);

  // Re-hydrate workspace on refresh — workspace store is not persisted
  useEffect(() => {
    if (workspace) return;
    usersApi.me().then(({ user, workspace: ws }) => {
      setUser({ userId: user.id, workspaceId: user.workspaceId, email: user.email, name: user.name });
      setWorkspace(ws);
    }).catch(() => {});
  }, []);

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
