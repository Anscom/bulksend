import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, Workspace, WorkspaceSummary } from '@bulksend/shared';
import { workspacesApi } from '../../lib/api/workspaces.js';
import { authApi } from '../../lib/api/auth.js';
import { usersApi } from '../../lib/api/users.js';
import { ApiError } from '../../lib/api/client.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { useWorkspaceStore } from '../../stores/workspace.store.js';

interface Props {
  workspace: Workspace;
  onClose: () => void;
}

type Tab = 'workspaces' | 'members';

const ROLE_COLORS: Record<string, string> = {
  owner: 'var(--indigo)',
  admin: 'var(--coral)',
  member: 'var(--slate)',
};

const planBadge: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
  padding: '2px 6px', borderRadius: 4,
};

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)',
  background: 'var(--bg)', color: 'var(--ink)', fontSize: 13, boxSizing: 'border-box',
};

export function WorkspacePanel({ workspace, onClose }: Props) {
  const navigate = useNavigate();
  const { userId, email, setTokens, setUser } = useAuthStore();
  const { setWorkspace } = useWorkspaceStore();

  const [tab, setTab] = useState<Tab>('workspaces');

  // Workspace list state
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [wsLoading, setWsLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Members state
  const [members, setMembers] = useState<User[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersMounted, setMembersMounted] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', name: '', password: '', role: 'member' as 'member' | 'admin' });
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const currentUser = members.find(m => m.id === userId);
  const canManage = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  const isOwner = currentUser?.role === 'owner';

  // Load workspace list on mount
  useEffect(() => {
    workspacesApi.listMine()
      .then(list => setWorkspaces(list))
      .catch(() => {})
      .finally(() => setWsLoading(false));
  }, []);

  // Load members when members tab is first opened
  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const list = await workspacesApi.listMembers(workspace.id);
      setMembers(list);
    } catch {} finally { setMembersLoading(false); }
  }, [workspace.id]);

  useEffect(() => {
    if (tab === 'members' && !membersMounted) {
      setMembersMounted(true);
      loadMembers();
    }
  }, [tab, membersMounted, loadMembers]);

  async function handleSwitch(targetId: string) {
    if (targetId === workspace.id) return;
    setSwitching(targetId);
    try {
      const tokens = await authApi.switchWorkspace(targetId);
      setTokens(tokens);
      const { user, workspace: ws } = await usersApi.me();
      setUser({ userId: user.id, workspaceId: user.workspaceId, email: user.email, name: user.name });
      setWorkspace(ws);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setCreateMsg({ type: 'err', text: err instanceof ApiError ? err.message : 'Failed to switch workspace.' });
    } finally { setSwitching(null); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateMsg(null);
    setCreateLoading(true);
    try {
      const { workspace: newWs } = await workspacesApi.create(createName);
      // Switch into the new workspace immediately
      const tokens = await authApi.switchWorkspace(newWs.id);
      setTokens(tokens);
      const { user, workspace: ws } = await usersApi.me();
      setUser({ userId: user.id, workspaceId: user.workspaceId, email: user.email, name: user.name });
      setWorkspace(ws);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setCreateMsg({ type: 'err', text: err instanceof ApiError ? err.message : 'Failed to create workspace.' });
      setCreateLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddMsg(null);
    setAddLoading(true);
    try {
      const member = await workspacesApi.addMember(workspace.id, addForm);
      setMembers(m => [...m, member]);
      setAddForm({ email: '', name: '', password: '', role: 'member' });
      setAddOpen(false);
      setAddMsg({ type: 'ok', text: `${member.name} added to workspace.` });
    } catch (err) {
      setAddMsg({ type: 'err', text: err instanceof ApiError ? err.message : 'Failed to add member.' });
    } finally { setAddLoading(false); }
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingId(memberId);
    try {
      await workspacesApi.removeMember(workspace.id, memberId);
      setMembers(m => m.filter(x => x.id !== memberId));
    } catch (err) {
      setAddMsg({ type: 'err', text: err instanceof ApiError ? err.message : 'Failed to remove member.' });
    } finally { setRemovingId(null); }
  }

  const initials = (s: string) => s.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  function Msg({ msg }: { msg: { type: 'ok' | 'err'; text: string } }) {
    return (
      <div style={{
        padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12,
        background: msg.type === 'ok' ? 'var(--green-tint, #ecfdf5)' : 'var(--red-tint, #fef2f2)',
        color: msg.type === 'ok' ? 'var(--green, #16a34a)' : 'var(--red, #dc2626)',
      }}>
        {msg.text}
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 201, background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, width: 480, maxWidth: 'calc(100vw - 32px)',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 8, background: 'var(--indigo)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {(workspace.name[0] ?? 'W').toUpperCase()}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{workspace.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{
                    ...planBadge,
                    background: workspace.plan === 'free' ? 'var(--border)' : 'var(--indigo-tint, #eef2ff)',
                    color: workspace.plan === 'free' ? 'var(--slate)' : 'var(--indigo)',
                  }}>
                    {workspace.plan}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--slate)' }}>/{workspace.slug}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginLeft: -20, marginRight: -20, paddingLeft: 20 }}>
            {(['workspaces', 'members'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, padding: '8px 14px',
                color: tab === t ? 'var(--indigo)' : 'var(--slate)',
                borderBottom: tab === t ? '2px solid var(--indigo)' : '2px solid transparent',
                marginBottom: -1, textTransform: 'capitalize',
              }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* ── WORKSPACES TAB ── */}
          {tab === 'workspaces' && (
            <>
              {createMsg && <Msg msg={createMsg} />}

              {wsLoading ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--slate)', fontSize: 13 }}>Loading…</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                  {workspaces.map(ws => {
                    const isCurrent = ws.id === workspace.id;
                    const isLoading = switching === ws.id;
                    return (
                      <button
                        key={ws.id}
                        onClick={() => handleSwitch(ws.id)}
                        disabled={isCurrent || isLoading}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                          borderRadius: 8, border: isCurrent ? '1px solid var(--indigo)' : '1px solid transparent',
                          background: isCurrent ? 'var(--indigo-tint, #eef2ff)' : 'transparent',
                          cursor: isCurrent ? 'default' : 'pointer', textAlign: 'left', width: '100%',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'var(--bg)'; }}
                        onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <span style={{
                          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                          background: isCurrent ? 'var(--indigo)' : 'var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700,
                          color: isCurrent ? '#fff' : 'var(--ink-2)',
                        }}>
                          {(ws.name[0] ?? 'W').toUpperCase()}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {ws.name}
                            {isCurrent && (
                              <span style={{ fontSize: 10, color: 'var(--indigo)', fontWeight: 700 }}>CURRENT</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--slate)' }}>/{ws.slug} · {ws.plan}</div>
                        </div>
                        {isLoading ? (
                          <span style={{ fontSize: 12, color: 'var(--slate)' }}>Switching…</span>
                        ) : !isCurrent ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--slate)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Create workspace */}
              {!createOpen ? (
                <button
                  onClick={() => { setCreateOpen(true); setCreateMsg(null); }}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1px dashed var(--border)', background: 'transparent',
                    color: 'var(--slate)', fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Create new workspace
                </button>
              ) : (
                <form onSubmit={handleCreate} style={{
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>New workspace</div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: 4 }}>
                      Workspace name
                    </label>
                    <input
                      style={inp}
                      placeholder="e.g. Acme Corp"
                      required
                      autoFocus
                      value={createName}
                      onChange={e => setCreateName(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={createLoading} style={{
                      flex: 1, padding: '8px', borderRadius: 6, border: 'none',
                      background: 'var(--indigo)', color: '#fff', fontSize: 13, fontWeight: 600,
                      cursor: createLoading ? 'not-allowed' : 'pointer', opacity: createLoading ? 0.7 : 1,
                    }}>
                      {createLoading ? 'Creating…' : 'Create & switch'}
                    </button>
                    <button type="button" onClick={() => { setCreateOpen(false); setCreateName(''); }} style={{
                      padding: '8px 14px', borderRadius: 6, border: '1px solid var(--border)',
                      background: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--ink)',
                    }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ── MEMBERS TAB ── */}
          {tab === 'members' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Members · {members.length || '—'}
                </span>
                {canManage && (
                  <button
                    onClick={() => { setAddOpen(o => !o); setAddMsg(null); }}
                    style={{
                      fontSize: 12, fontWeight: 600, color: 'var(--indigo)', background: 'none',
                      border: '1px solid var(--indigo)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer',
                    }}
                  >
                    {addOpen ? 'Cancel' : '+ Add member'}
                  </button>
                )}
              </div>

              {addMsg && <Msg msg={addMsg} />}

              {addOpen && canManage && (
                <form onSubmit={handleAddMember} style={{
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '14px 16px', marginBottom: 16,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: 4 }}>Full name</label>
                      <input style={inp} placeholder="Jane Smith" required value={addForm.name}
                        onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: 4 }}>Email</label>
                      <input style={inp} type="email" placeholder="jane@company.com" required value={addForm.email}
                        onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: 4 }}>Temp password</label>
                      <input style={inp} type="password" placeholder="Min. 8 chars" minLength={8} required value={addForm.password}
                        onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate)', display: 'block', marginBottom: 4 }}>Role</label>
                      <select style={{ ...inp }} value={addForm.role}
                        onChange={e => setAddForm(f => ({ ...f, role: e.target.value as 'member' | 'admin' }))}>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={addLoading} style={{
                    width: '100%', padding: '8px', borderRadius: 6, border: 'none',
                    background: 'var(--indigo)', color: '#fff', fontSize: 13, fontWeight: 600,
                    cursor: addLoading ? 'not-allowed' : 'pointer', opacity: addLoading ? 0.7 : 1,
                  }}>
                    {addLoading ? 'Adding…' : 'Add to workspace'}
                  </button>
                </form>
              )}

              {membersLoading ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--slate)', fontSize: 13 }}>Loading members…</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {members.map(m => (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8,
                      background: m.id === userId ? 'var(--indigo-tint, #eef2ff)' : 'transparent',
                    }}>
                      <span style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: m.id === userId ? 'var(--indigo)' : 'var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                        color: m.id === userId ? '#fff' : 'var(--ink-2)',
                      }}>
                        {initials(m.name)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.name}{m.id === userId && <span style={{ color: 'var(--slate)', fontWeight: 400 }}> (you)</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--slate)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.email}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
                        textTransform: 'capitalize', flexShrink: 0,
                        border: `1px solid ${ROLE_COLORS[m.role] ?? 'var(--border)'}`,
                        color: ROLE_COLORS[m.role] ?? 'var(--slate)',
                      }}>
                        {m.role}
                      </span>
                      {isOwner && m.role !== 'owner' && m.id !== userId && (
                        <button onClick={() => handleRemoveMember(m.id)} disabled={removingId === m.id}
                          title="Remove member"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--slate)', padding: 4, flexShrink: 0,
                            opacity: removingId === m.id ? 0.4 : 1,
                          }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: 'var(--slate)' }}>
            {workspace.sendRatePerHour.toLocaleString()} emails/hr · signed in as {email}
          </span>
          <button onClick={onClose} style={{
            fontSize: 13, padding: '6px 16px', borderRadius: 6,
            border: '1px solid var(--border)', background: 'none',
            color: 'var(--ink)', cursor: 'pointer', fontWeight: 500,
          }}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}
