import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
      <h1 style={{ fontSize: '1.5rem', margin: '0 0 8px', fontWeight: 800 }}>404 — Page Not Found</h1>
      <p style={{ color: '#475569', margin: '0 0 16px' }}>
        The route you requested does not exist in CoreSpec.
      </p>
      <Link to="/" className="btn btn-primary">
        Return to Storefront
      </Link>
    </section>
  );
}