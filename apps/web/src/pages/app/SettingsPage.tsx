import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { usersApi } from '../../lib/api/users.js';
import { workspacesApi } from '../../lib/api/workspaces.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { useWorkspaceStore } from '../../stores/workspace.store.js';
import { ApiError } from '../../lib/api/client.js';

export function SettingsPage() {
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();
  const { name: storedName, email: storedEmail, setUser, userId, workspaceId } = useAuthStore();
  const workspace = useWorkspaceStore((s) => s.workspace);

  const [profile, setProfile] = useState({ name: storedName ?? '', email: storedEmail ?? '' });
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const [wsForm, setWsForm] = useState({
    name: workspace?.name ?? '',
    sendRatePerHour: workspace?.sendRatePerHour ?? 100,
  });
  const [wsMsg, setWsMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [wsLoading, setWsLoading] = useState(false);

  const [brevoKey, setBrevoKey] = useState('');
  const [brevoMsg, setBrevoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [brevoLoading, setBrevoLoading] = useState(false);

  const [senderForm, setSenderForm] = useState({
    senderEmail: workspace?.senderEmail ?? '',
    senderName: workspace?.senderName ?? '',
  });
  const [senderMsg, setSenderMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [senderLoading, setSenderLoading] = useState(false);

  useEffect(() => {
    setProfile({ name: storedName ?? '', email: storedEmail ?? '' });
  }, [storedName, storedEmail]);

  useEffect(() => {
    if (workspace) {
      setWsForm({ name: workspace.name, sendRatePerHour: workspace.sendRatePerHour });
      setSenderForm({ senderEmail: workspace.senderEmail ?? '', senderName: workspace.senderName ?? '' });
    }
  }, [workspace?.id]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      const { user } = await usersApi.update({ name: profile.name, email: profile.email });
      setUser({ userId: userId!, workspaceId: workspaceId!, email: user.email, name: user.name });
      setProfileMsg({ type: 'ok', text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ type: 'err', text: err instanceof ApiError ? err.message : 'Update failed.' });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next !== pw.confirm) {
      setPwMsg({ type: 'err', text: 'New passwords do not match.' });
      return;
    }
    if (pw.next.length < 8) {
      setPwMsg({ type: 'err', text: 'New password must be at least 8 characters.' });
      return;
    }
    setPwLoading(true);
    try {
      await usersApi.changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({ type: 'ok', text: 'Password changed successfully.' });
    } catch (err) {
      setPwMsg({ type: 'err', text: err instanceof ApiError ? err.message : 'Password change failed.' });
    } finally {
      setPwLoading(false);
    }
  }

  async function handleSenderSave(e: React.FormEvent) {
    e.preventDefault();
    setSenderMsg(null);
    setSenderLoading(true);
    try {
      const updated = await workspacesApi.update(workspaceId!, {
        senderEmail: senderForm.senderEmail.trim() || undefined,
        senderName: senderForm.senderName.trim() || undefined,
      });
      setWorkspace(updated);
      setSenderMsg({ type: 'ok', text: 'Sender details saved.' });
    } catch (err) {
      setSenderMsg({ type: 'err', text: err instanceof ApiError ? err.message : 'Failed to save.' });
    } finally {
      setSenderLoading(false);
    }
  }

  async function handleBrevoSave(e: React.FormEvent) {
    e.preventDefault();
    if (!brevoKey.trim()) return;
    setBrevoMsg(null);
    setBrevoLoading(true);
    try {
      const updated = await workspacesApi.update(workspaceId!, { brevoApiKey: brevoKey.trim() });
      setWorkspace(updated);
      setBrevoKey('');
      setBrevoMsg({ type: 'ok', text: 'Brevo API key saved.' });
    } catch (err) {
      setBrevoMsg({ type: 'err', text: err instanceof ApiError ? err.message : 'Failed to save key.' });
    } finally {
      setBrevoLoading(false);
    }
  }

  async function handleWorkspaceSave(e: React.FormEvent) {
    e.preventDefault();
    setWsMsg(null);
    setWsLoading(true);
    try {
      const updated = await workspacesApi.update(workspaceId!, {
        name: wsForm.name,
        sendRatePerHour: wsForm.sendRatePerHour,
      });
      setWorkspace(updated);
      setWsMsg({ type: 'ok', text: 'Workspace settings saved.' });
    } catch (err) {
      setWsMsg({ type: 'err', text: err instanceof ApiError ? err.message : 'Update failed.' });
    } finally {
      setWsLoading(false);
    }
  }

  const sectionStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r)',
    padding: '28px 32px',
    marginBottom: 24,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: 'var(--ink-2)', marginBottom: 6,
  };

  const fieldStyle: React.CSSProperties = { marginBottom: 16 };

  function Alert({ msg }: { msg: { type: 'ok' | 'err'; text: string } }) {
    return (
      <div style={{
        padding: '10px 14px', borderRadius: 'var(--r)', fontSize: 13, marginBottom: 16,
        background: msg.type === 'ok' ? 'var(--green-tint, #ecfdf5)' : 'var(--red-tint)',
        color: msg.type === 'ok' ? 'var(--green, #16a34a)' : 'var(--red)',
      }}>
        {msg.text}
      </div>
    );
  }

  return (
    <div className="view active">
      <Topbar crumb={workspace?.name ?? 'Workspace'} title="Settings" onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 24px 60px', maxWidth: 640, margin: '0 auto' }}>

        {/* Profile section */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Profile</h2>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 24 }}>
            Update your display name and email address.
          </p>

          <form onSubmit={handleProfileSave}>
            {profileMsg && <Alert msg={profileMsg} />}

            <div style={fieldStyle}>
              <label style={labelStyle}>Name</label>
              <input
                className="inp"
                type="text"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Email</label>
              <input
                className="inp"
                type="email"
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                {profileLoading ? 'Saving…' : 'Save changes'}
              </button>
              <span style={{ fontSize: 13, color: 'var(--slate)' }}>
                Role: <strong>{storedName ? 'owner' : '—'}</strong>
              </span>
            </div>
          </form>
        </div>

        {/* Change password section */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Change password</h2>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 24 }}>
            Choose a strong password of at least 8 characters.
          </p>

          <form onSubmit={handlePasswordSave}>
            {pwMsg && <Alert msg={pwMsg} />}

            <div style={fieldStyle}>
              <label style={labelStyle}>Current password</label>
              <input
                className="inp"
                type="password"
                placeholder="••••••••"
                value={pw.current}
                onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                required
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>New password</label>
              <input
                className="inp"
                type="password"
                placeholder="Min. 8 characters"
                value={pw.next}
                onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                required
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Confirm new password</label>
              <input
                className="inp"
                type="password"
                placeholder="••••••••"
                value={pw.confirm}
                onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={pwLoading}>
              {pwLoading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>

        {/* Workspace settings */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Workspace</h2>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 24 }}>
            Update your workspace name.
          </p>

          <form onSubmit={handleWorkspaceSave}>
            {wsMsg && <Alert msg={wsMsg} />}

            <div style={fieldStyle}>
              <label style={labelStyle}>Workspace name</label>
              <input
                className="inp"
                type="text"
                value={wsForm.name}
                onChange={e => setWsForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Plan', value: workspace?.plan ?? '—' },
                { label: 'Slug', value: workspace?.slug ?? '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary" disabled={wsLoading}>
              {wsLoading ? 'Saving…' : 'Save workspace'}
            </button>
          </form>
        </div>

        {/* Default sender */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Default sender</h2>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 24 }}>
            The "From" name and email used for every campaign. Must be a verified sender in your Brevo account.
          </p>

          <form onSubmit={handleSenderSave}>
            {senderMsg && <Alert msg={senderMsg} />}

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ ...fieldStyle, flex: 1, marginBottom: 0 }}>
                <label style={labelStyle}>From name</label>
                <input
                  className="inp"
                  type="text"
                  placeholder="Your Name or Company"
                  value={senderForm.senderName}
                  onChange={e => setSenderForm(f => ({ ...f, senderName: e.target.value }))}
                />
              </div>
              <div style={{ ...fieldStyle, flex: 1, marginBottom: 0 }}>
                <label style={labelStyle}>From email</label>
                <input
                  className="inp"
                  type="email"
                  placeholder="hello@yourdomain.com"
                  value={senderForm.senderEmail}
                  onChange={e => setSenderForm(f => ({ ...f, senderEmail: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 16 }}>
              Add this email as a verified sender in{' '}
              <strong>Brevo → Senders &amp; IP → Senders</strong> before saving.
            </div>

            <button type="submit" className="btn btn-primary" disabled={senderLoading}>
              {senderLoading ? 'Saving…' : 'Save sender'}
            </button>
          </form>
        </div>

        {/* Email provider */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Email provider</h2>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 24 }}>
            Connect your Brevo account to send campaigns.
            {workspace?.brevoApiKey && (
              <span style={{ marginLeft: 8, color: 'var(--green)', fontWeight: 600 }}>✓ API key configured</span>
            )}
          </p>

          <form onSubmit={handleBrevoSave}>
            {brevoMsg && <Alert msg={brevoMsg} />}

            <div style={fieldStyle}>
              <label style={labelStyle}>Brevo API key</label>
              <input
                className="inp"
                type="password"
                placeholder={workspace?.brevoApiKey ? '••••••••••••••••••••••••••••••••' : 'xkeysib-…'}
                value={brevoKey}
                onChange={e => setBrevoKey(e.target.value)}
                autoComplete="off"
              />
              <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 6 }}>
                Find your API key in Brevo → SMTP &amp; API → API Keys.
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={brevoLoading || !brevoKey.trim()}>
              {brevoLoading ? 'Saving…' : workspace?.brevoApiKey ? 'Update API key' : 'Save API key'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
