/**
 * Dev seed — loads one workspace, an owner account, tags, 50 contacts, a segment,
 * and 4 campaigns so the app has data on first launch.
 *
 * Run:  cd apps/api && npx prisma db seed
 *   or: pnpm ts-node ../../infra/db/seed.ts  (from apps/api/)
 */
import { PrismaClient, CampaignStatus, ContactStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ── Workspace ──────────────────────────────────────────────────────────────
  const ws = await prisma.workspace.upsert({
    where: { slug: 'bulksend-main' },
    update: {},
    create: {
      name: 'BulkSend',
      slug: 'bulksend-main',
      plan: 'free',
      sendRatePerHour: 100,
    },
  });
  console.log('workspace:', ws.id);

  // ── Owner user ─────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'anscom@bulksend.com' },
    update: {},
    create: {
      workspaceId: ws.id,
      email: 'anscom@bulksend.com',
      name: 'Anscom',
      role: 'owner',
      passwordHash: hash,
    },
  });
  console.log('user:', user.id);

  // ── Tags ───────────────────────────────────────────────────────────────────
  const tagDefs = [
    { name: 'Pro',        color: '#4F46E5' },
    { name: 'Newsletter', color: '#F97066' },
    { name: 'Beta',       color: '#22C55E' },
    { name: 'Enterprise', color: '#F59E0B' },
    { name: 'Trial',      color: '#94A3B8' },
    { name: 'Webinar',    color: '#3B82F6' },
  ];
  const tags = await Promise.all(
    tagDefs.map(t =>
      prisma.tag.upsert({
        where: { workspaceId_name: { workspaceId: ws.id, name: t.name } },
        update: {},
        create: { workspaceId: ws.id, name: t.name, color: t.color },
      })
    )
  );
  console.log('tags:', tags.length);

  // ── Contacts (50) ──────────────────────────────────────────────────────────
  const firstNames = ['Maya', 'Liam', 'Sofia', 'Noah', 'Ava', 'Ethan', 'Isla', 'Lucas', 'Emma', 'Kai'];
  const lastNames  = ['Chen', 'Patel', 'Rivera', 'Kim', 'Okafor', 'Nguyen', 'Silva', 'Haddad', 'Larsson', 'Mori'];
  const domains    = ['gmail.com', 'outlook.com', 'hey.com', 'fastmail.com'];
  const statuses: ContactStatus[] = ['subscribed', 'subscribed', 'subscribed', 'subscribed', 'unsubscribed', 'bounced'];

  const contacts = [];
  for (let i = 0; i < 50; i++) {
    const fn = firstNames[i % firstNames.length]!;
    const ln = lastNames[(i * 3) % lastNames.length]!;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@${domains[i % domains.length]}`;
    const c = await prisma.contact.upsert({
      where: { workspaceId_email: { workspaceId: ws.id, email } },
      update: {},
      create: {
        workspaceId: ws.id,
        email,
        firstName: fn,
        lastName: ln,
        status: statuses[i % statuses.length]!,
        attributes: {
          plan: i % 5 === 0 ? 'pro' : 'free',
          city: (['NYC', 'LA', 'Chicago', 'Austin'] as const)[i % 4],
        },
      },
    });
    contacts.push(c);
  }
  console.log('contacts:', contacts.length);

  // ── Segment ────────────────────────────────────────────────────────────────
  const existingSegment = await prisma.segment.findFirst({
    where: { workspaceId: ws.id, name: 'Active Subscribers' },
  });
  const segment = existingSegment ?? await prisma.segment.create({
    data: {
      workspaceId: ws.id,
      name: 'Active Subscribers',
      filters: [{ field: 'status', op: 'eq', value: 'subscribed' }],
      contactCount: contacts.filter(c => c.status === 'subscribed').length,
    },
  });
  console.log('segment:', segment.id);

  // ── Campaigns ──────────────────────────────────────────────────────────────
  const campaignDefs: Array<{
    name: string; subject: string; status: CampaignStatus; totalRecipients: number;
  }> = [
    { name: 'Spring Launch 2026',  subject: 'Spring is here — big updates inside', status: 'sent',      totalRecipients: 48210 },
    { name: 'Monthly Newsletter',  subject: 'Your April roundup',                   status: 'sent',      totalRecipients: 46980 },
    { name: 'Product Update v2.4', subject: 'New features in v2.4',                 status: 'draft',     totalRecipients: 0     },
    { name: 'Re-engagement Wave',  subject: 'We miss you',                          status: 'scheduled', totalRecipients: 12400 },
  ];

  for (const def of campaignDefs) {
    const existing = await prisma.campaign.findFirst({
      where: { workspaceId: ws.id, name: def.name },
    });
    if (!existing) {
      await prisma.campaign.create({
        data: {
          workspaceId: ws.id,
          segmentId: segment.id,
          name: def.name,
          subject: def.subject,
          fromName: 'Acme Marketing',
          fromEmail: 'hello@acme.co',
          bodyHtml: `<h1>${def.subject}</h1><p>Hello {{first_name}},</p><p>Check out what's new.</p>`,
          bodyText: `${def.subject}\n\nHello {{first_name}},\n\nCheck out what's new.`,
          status: def.status,
          totalRecipients: def.totalRecipients,
          scheduledAt: def.status === 'scheduled' ? new Date(Date.now() + 86_400_000) : null,
          sentAt: def.status === 'sent' ? new Date(Date.now() - 86_400_000) : null,
        },
      });
    }
  }
  console.log('campaigns seeded');
  console.log('\nSeed complete.');
  console.log('  Login: anscom@bulksend.com / 123456');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
