import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';
import { Badge } from '../../components/ui/Badge.js';
import type { ContactStatus } from '@bulksend/shared';

const AVATAR_COLORS = ['var(--indigo)', 'var(--coral)', 'var(--green)', 'var(--amber)', 'var(--blue)'];
const FIRST_NAMES = ['Maya', 'Liam', 'Sofia', 'Noah', 'Ava', 'Ethan', 'Isla', 'Lucas', 'Emma', 'Kai', 'Zoe', 'Omar'];
const LAST_NAMES  = ['Chen', 'Patel', 'Rivera', 'Kim', 'Okafor', 'Nguyen', 'Silva', 'Haddad', 'Larsson', 'Mori', 'Costa', 'Reyes'];
const TAG_SETS = [
  [['Pro', 'var(--indigo)']],
  [['Newsletter', 'var(--coral)']],
  [['Pro', 'var(--indigo)'], ['Beta', 'var(--green)']],
  [['Enterprise', 'var(--amber)']],
  [['Newsletter', 'var(--coral)'], ['Webinar', 'var(--blue)']],
  [['Trial', 'var(--slate)']],
] as [string, string][][];
const STATUSES: ContactStatus[] = ['subscribed', 'subscribed', 'subscribed', 'subscribed', 'unsubscribed', 'bounced'];
const DATES = ['Jun 4', 'Jun 3', 'Jun 1', 'May 30', 'May 28', 'May 25', 'May 22', 'May 19'];

const contacts = Array.from({ length: 12 }, (_, i) => {
  const fn = FIRST_NAMES[i % FIRST_NAMES.length]!;
  const ln = LAST_NAMES[(i * 5) % LAST_NAMES.length]!;
  return {
    id: String(i),
    name: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${['gmail.com', 'acme.co', 'outlook.com', 'hey.com'][i % 4]}`,
    status: STATUSES[i % STATUSES.length]!,
    tags: TAG_SETS[i % TAG_SETS.length]!,
    date: DATES[i % DATES.length]!,
    avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length]!,
    initials: `${fn[0]}${ln[0]}`,
  };
});

export function ContactsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();

  const filtered = contacts.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'subscribed' && c.status !== 'subscribed') return false;
    if (activeTab === 'unsubscribed' && c.status !== 'unsubscribed') return false;
    if (activeTab === 'bounced' && c.status !== 'bounced') return false;
    return true;
  });

  return (
    <div className="view active">
      <Topbar crumb="Acme Marketing" title="Contacts" onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>

        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'Total contacts', value: '48,210', color: '' },
            { label: 'Subscribed', value: '46,980', color: 'var(--green)' },
            { label: 'Unsubscribed', value: '890', color: 'var(--amber)' },
            { label: 'Bounced', value: '340', color: 'var(--red)' },
          ].map(s => (
            <div key={s.label} className="kpi">
              <div className="kl" style={{ color: 'var(--slate)' }}>{s.label}</div>
              <div className="kv num" style={s.color ? { color: s.color } : {}}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="view-head">
          <div className="vh-l">
            <div className="tabs">
              {[['all', 'All', '48.2k'], ['subscribed', 'Subscribed', '46,980'], ['unsubscribed', 'Unsubscribed', '890'], ['bounced', 'Bounced', '340']].map(([id, label, cnt]) => (
                <button key={id} className={`tab${activeTab === id ? ' active' : ''}`} onClick={() => setActiveTab(id!)}>
                  {label} <span className="cnt">{cnt}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="vh-actions">
            <div className="tb-search" style={{ width: 220, maxWidth: '100%' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-ghost btn-sm" id="importBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M12 21V9M7 14l5-5 5 5M5 3h14"/></svg>
              Import CSV
            </button>
          </div>
        </div>

        <div className="table-card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Status</th>
                <th className="hide-sm">Tags</th>
                <th className="hide-sm">Added</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="cell-contact">
                      <span className="avatar" style={{ width: 34, height: 34, background: c.avatarColor }}>{c.initials}</span>
                      <div>
                        <div className="t-name">{c.name}</div>
                        <div className="t-sub">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><Badge variant={c.status}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</Badge></td>
                  <td className="hide-sm">
                    <div className="row-tags">
                      {c.tags.map(([name, color]) => (
                        <span key={name} className="tag">
                          <span className="td" style={{ background: color }} />
                          {name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="hide-sm t-mute">{c.date}</td>
                  <td className="t-actions">
                    <button className="t-more">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
