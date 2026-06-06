import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../lib/api/auth.js';
import { usersApi } from '../../lib/api/users.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { useWorkspaceStore } from '../../stores/workspace.store.js';
import '../../styles/site.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { setTokens, setUser, isAuthenticated } = useAuthStore();
  const { setWorkspace } = useWorkspaceStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard', { replace: true });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await authApi.login(form);
      setTokens(tokens);
      const { user, workspace } = await usersApi.me();
      setUser({ userId: user.id, workspaceId: user.workspaceId, email: user.email, name: user.name });
      setWorkspace(workspace);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" className="brand" style={{ justifyContent: 'center', marginBottom: 8 }}>
            <span className="brand-mark">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M2 12l19-9-9 19-2-8-8-2z" fill="#fff"/></svg>
            </span>
            BulkSend
          </Link>
          <p style={{ color: 'var(--slate)', marginTop: 8, fontSize: 15 }}>Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ background: 'var(--red-tint)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--r)', fontSize: 13 }}>
              {error}
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              className="inp"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              className="inp"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--slate)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--indigo)', fontWeight: 600 }}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
