import { useOutletContext } from 'react-router-dom';
import { Topbar } from '../../components/layout/Topbar.js';

interface PlaceholderPageProps {
  crumb: string;
  title: string;
  description: string;
}

export function PlaceholderPage({ crumb, title, description }: PlaceholderPageProps) {
  const { onMenuOpen } = useOutletContext<{ onMenuOpen: () => void }>();

  return (
    <div className="view active">
      <Topbar crumb={crumb} title={title} onMenuOpen={onMenuOpen} />
      <div style={{ padding: '28px 24px 60px', maxWidth: 1240, margin: '0 auto' }}>
        <div className="card card-pad" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--indigo-tint)', display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: 'var(--indigo)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
          </div>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
          <p style={{ color: 'var(--slate)', fontSize: 14, maxWidth: '40ch', margin: '0 auto' }}>{description}</p>
          <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--faint)' }}>Coming soon</div>
        </div>
      </div>
    </div>
  );
}
