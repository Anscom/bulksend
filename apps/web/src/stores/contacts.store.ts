import type { ContactStatus } from '@bulksend/shared';

const LS_KEY = 'bulksend_contacts';

export type ContactRecord = {
  id: string;
  name: string;
  email: string;
  status: ContactStatus;
  tags: [string, string][];
  date: string;
  avatarColor: string;
  initials: string;
};

const AVATAR_COLORS = ['var(--indigo)', 'var(--coral)', 'var(--green)', 'var(--amber)', 'var(--blue)'];

function mkInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

const INITIAL: ContactRecord[] = [
  { id: '1', name: 'Ooi Cheong Wen', email: 'ooicheongwen123456@gmail.com', status: 'subscribed', tags: [['Pro', 'var(--indigo)']], date: 'Jun 11', avatarColor: AVATAR_COLORS[0]!, initials: 'OC' },
  { id: '2', name: 'Anscom Ooi',     email: 'anscomooi@gmail.com',           status: 'subscribed', tags: [['Newsletter', 'var(--coral)']], date: 'Jun 10', avatarColor: AVATAR_COLORS[1]!, initials: 'AO' },
  { id: '3', name: 'Maya Chen',      email: 'maya.chen@acme.co',             status: 'subscribed', tags: [['Enterprise', 'var(--amber)']], date: 'Jun 4', avatarColor: AVATAR_COLORS[2]!, initials: 'MC' },
  { id: '4', name: 'Liam Patel',     email: 'liam.patel@outlook.com',        status: 'unsubscribed', tags: [['Trial', 'var(--slate)']], date: 'May 30', avatarColor: AVATAR_COLORS[3]!, initials: 'LP' },
  { id: '5', name: 'Sofia Rivera',   email: 'sofia.rivera@hey.com',          status: 'bounced', tags: [['Newsletter', 'var(--coral)'], ['Webinar', 'var(--blue)']], date: 'May 25', avatarColor: AVATAR_COLORS[4]!, initials: 'SR' },
];

function load(): ContactRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as ContactRecord[];
  } catch {}
  return [...INITIAL];
}

function save(contacts: ContactRecord[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(contacts));
  } catch {}
}

let _contacts: ContactRecord[] = load();
const _listeners = new Set<() => void>();
function notify() { _listeners.forEach(fn => fn()); }

export const contactsStore = {
  getAll: (): ContactRecord[] => _contacts,
  getSubscribed: (): ContactRecord[] => _contacts.filter(c => c.status === 'subscribed'),

  add: (c: Omit<ContactRecord, 'id'>): ContactRecord => {
    const record: ContactRecord = { ...c, id: `c-${Date.now()}` };
    _contacts = [record, ..._contacts];
    save(_contacts);
    notify();
    return record;
  },

  remove: (id: string): void => {
    _contacts = _contacts.filter(c => c.id !== id);
    save(_contacts);
    notify();
  },

  make: (name: string, email: string, status: ContactStatus): ContactRecord => ({
    id: `c-${Date.now()}`,
    name,
    email,
    status,
    tags: [],
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    avatarColor: AVATAR_COLORS[_contacts.length % AVATAR_COLORS.length]!,
    initials: mkInitials(name),
  }),

  subscribe: (fn: () => void): (() => void) => {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};
