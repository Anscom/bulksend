interface KPICardProps {
  label: string;
  value: string;
  trend?: { direction: 'up' | 'down'; value: string };
  footnote?: string;
  iconVariant?: 'default' | 'coral' | 'green' | 'amber';
  icon: React.ReactNode;
}

const iconVariantClass: Record<string, string> = {
  default: '',
  coral:   'c',
  green:   'g',
  amber:   'a',
};

export function KPICard({ label, value, trend, footnote, iconVariant = 'default', icon }: KPICardProps) {
  return (
    <div className="kpi">
      <div className="kl">
        <span className={`ki${iconVariant !== 'default' ? ` ${iconVariantClass[iconVariant]}` : ''}`}>
          {icon}
        </span>
        {label}
      </div>
      <div className="kv num">{value}</div>
      {(trend || footnote) && (
        <div className="kf">
          {trend && (
            <span className={`trend ${trend.direction}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {footnote && <span className="kfm">{footnote}</span>}
        </div>
      )}
    </div>
  );
}
