import type { CampaignStatus, ContactStatus } from '@bulksend/shared';

type BadgeVariant = CampaignStatus | ContactStatus | 'default';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  pulse?: boolean;
}

const variantClass: Record<BadgeVariant, string> = {
  sending:      'sending',
  sent:         'sent',
  scheduled:    'scheduled',
  draft:        'draft',
  paused:       'paused',
  failed:       'draft',
  subscribed:   'subscribed',
  unsubscribed: 'unsubscribed',
  bounced:      'bounced',
  default:      'draft',
};

export function Badge({ variant, children, pulse }: BadgeProps) {
  return (
    <span className={`badge ${variantClass[variant] ?? 'draft'}`}>
      <span className="d" style={pulse ? { animation: 'bpulse 1.6s infinite' } : undefined} />
      {children}
    </span>
  );
}
