import type { Campaign } from '@bulksend/shared';

const LS_KEY = 'bulksend_campaigns';
const LS_RATES_KEY = 'bulksend_campaign_rates';

const DATE_FIELDS: (keyof Campaign)[] = ['scheduledAt', 'sentAt', 'createdAt', 'updatedAt'];

function reviveCampaign(raw: unknown): Campaign {
  const r = raw as Record<string, unknown>;
  const c: Record<string, unknown> = { ...r };
  for (const f of DATE_FIELDS) {
    const v = r[f as string];
    c[f as string] = v ? new Date(v as string) : null;
  }
  return c as unknown as Campaign;
}

const INITIAL: Campaign[] = [
  {
    id: '1', workspaceId: 'w1', name: 'June Product Update', subject: "What's new in June — features you'll love",
    previewText: 'Packed with updates just for you', fromName: 'Acme Marketing', fromEmail: 'hello@acme.co',
    bodyHtml: '<p>Hello!</p>', bodyText: 'Hello!', segmentId: null, status: 'sent',
    scheduledAt: null, sentAt: new Date('2026-06-04'), totalRecipients: 4820,
    createdAt: new Date('2026-06-01'), updatedAt: new Date('2026-06-04'),
  },
  {
    id: '2', workspaceId: 'w1', name: 'Summer Sale Announcement', subject: '☀️ Our biggest sale starts now',
    previewText: 'Up to 40% off everything', fromName: 'Acme Marketing', fromEmail: 'hello@acme.co',
    bodyHtml: '<p>Sale!</p>', bodyText: 'Sale!', segmentId: null, status: 'sending',
    scheduledAt: null, sentAt: null, totalRecipients: 12400,
    createdAt: new Date('2026-06-10'), updatedAt: new Date('2026-06-11'),
  },
  {
    id: '3', workspaceId: 'w1', name: 'Welcome Series — Day 3', subject: 'Tips to get started faster',
    previewText: 'Three things to try today', fromName: 'Acme', fromEmail: 'onboarding@acme.co',
    bodyHtml: '<p>Tips!</p>', bodyText: 'Tips!', segmentId: null, status: 'scheduled',
    scheduledAt: new Date('2026-06-15T10:00:00'), sentAt: null, totalRecipients: 320,
    createdAt: new Date('2026-06-09'), updatedAt: new Date('2026-06-09'),
  },
  {
    id: '4', workspaceId: 'w1', name: 'May Newsletter', subject: 'Your May roundup is here',
    previewText: 'Industry news + our picks', fromName: 'Acme Marketing', fromEmail: 'hello@acme.co',
    bodyHtml: '<p>News!</p>', bodyText: 'News!', segmentId: null, status: 'sent',
    scheduledAt: null, sentAt: new Date('2026-05-30'), totalRecipients: 5100,
    createdAt: new Date('2026-05-28'), updatedAt: new Date('2026-05-30'),
  },
  {
    id: '5', workspaceId: 'w1', name: 'Re-engagement Campaign', subject: 'We miss you — come back?',
    previewText: 'A little something to say hi', fromName: 'Acme', fromEmail: 'hello@acme.co',
    bodyHtml: '<p>Hi!</p>', bodyText: 'Hi!', segmentId: null, status: 'draft',
    scheduledAt: null, sentAt: null, totalRecipients: 0,
    createdAt: new Date('2026-06-11'), updatedAt: new Date('2026-06-11'),
  },
];

const INITIAL_RATES: Record<string, { open: number | null; click: number | null }> = {
  '1': { open: 42, click: 11 },
  '2': { open: null, click: null },
  '3': { open: null, click: null },
  '4': { open: 38, click: 8 },
  '5': { open: null, click: null },
};

function loadCampaigns(): Campaign[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return (JSON.parse(raw) as unknown[]).map(reviveCampaign);
  } catch {}
  return [...INITIAL];
}

function loadRates(): Record<string, { open: number | null; click: number | null }> {
  try {
    const raw = localStorage.getItem(LS_RATES_KEY);
    if (raw) return JSON.parse(raw) as Record<string, { open: number | null; click: number | null }>;
  } catch {}
  return { ...INITIAL_RATES };
}

function save(campaigns: Campaign[], rates: Record<string, { open: number | null; click: number | null }>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(campaigns));
    localStorage.setItem(LS_RATES_KEY, JSON.stringify(rates));
  } catch {}
}

let _campaigns: Campaign[] = loadCampaigns();
let _rates = loadRates();
const _listeners = new Set<() => void>();

function notify() { _listeners.forEach(fn => fn()); }

export const campaignStore = {
  getAll: (): Campaign[] => _campaigns,
  getRates: (): Record<string, { open: number | null; click: number | null }> => _rates,

  add: (c: Campaign): void => {
    _campaigns = [c, ..._campaigns];
    _rates = { ..._rates, [c.id]: { open: null, click: null } };
    save(_campaigns, _rates);
    notify();
  },

  update: (id: string, patch: Partial<Campaign>): void => {
    _campaigns = _campaigns.map(c => c.id === id ? { ...c, ...patch, updatedAt: new Date() } : c);
    save(_campaigns, _rates);
    notify();
  },

  remove: (id: string): void => {
    _campaigns = _campaigns.filter(c => c.id !== id);
    const r = { ..._rates };
    delete r[id];
    _rates = r;
    save(_campaigns, _rates);
    notify();
  },

  subscribe: (fn: () => void): (() => void) => {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};
