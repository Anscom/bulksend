import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../lib/api/auth.js';
import { usersApi } from '../../lib/api/users.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { useWorkspaceStore } from '../../stores/workspace.store.js';

export function SignupPage() {
  const navigate = useNavigate();
  const { setTokens, setUser, isAuthenticated } = useAuthStore();
  const { setWorkspace } = useWorkspaceStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', workspaceName: '' });
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
      const tokens = await authApi.signup(form);
      setTokens(tokens);
      const { user, workspace } = await usersApi.me();
      setUser({ userId: user.id, workspaceId: user.workspaceId, email: user.email, name: user.name });
      setWorkspace(workspace);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" className="brand" style={{ justifyContent: 'center', marginBottom: 8 }}>
            <span className="brand-mark">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M2 12l19-9-9 19-2-8-8-2z" fill="#fff"/></svg>
            </span>
            BulkSend
          </Link>
          <p style={{ color: 'var(--slate)', marginTop: 8, fontSize: 15 }}>Create your account — free, no credit card</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ background: 'var(--red-tint)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--r)', fontSize: 13 }}>
              {error}
            </div>
          )}
          {[
            { label: 'Your name', field: 'name', type: 'text', placeholder: 'Jordan Lee' },
            { label: 'Work email', field: 'email', type: 'email', placeholder: 'you@company.com' },
            { label: 'Password', field: 'password', type: 'password', placeholder: 'Minimum 8 characters' },
            { label: 'Workspace name', field: 'workspaceName', type: 'text', placeholder: 'Acme Marketing' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>{label}</label>
              <input type={type} className="inp" placeholder={placeholder} value={form[field as keyof typeof form]} onChange={update(field as keyof typeof form)} required />
            </div>
          ))}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Start for free →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--slate)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--indigo)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
