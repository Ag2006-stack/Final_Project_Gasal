import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../api/endpoints';
import { IconSparkles } from '../components/Icons';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/SkeletonLoader';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    productsApi
      .list({ limit: 6 }, controller.signal)
      .then(({ data }) => {
        setFeatured(Array.isArray(data) ? data : data?.items || []);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <div>
      <section className="hero-banner">
        <div className="hero-eyebrow">
          <IconSparkles size={14} />
          <span>CoreSpec Hardware Studio</span>
        </div>
        <h1 className="hero-title">Precision Parts, Laptops & High-Refresh Displays</h1>
        <p className="hero-subtitle">
          Compare verified specs or describe your build budget to our Spec AI for instant recommendations.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/ai-assistant" className="btn btn-accent">
            <IconSparkles size={16} />
            <span>Ask Spec AI</span>
          </Link>
          <Link to="/products" className="btn btn-ghost-dark">
            Explore Catalog
          </Link>
        </div>
      </section>

      <nav className="chip-row" aria-label="Quick hardware categories">
        <Link to="/products" className="chip active">All Hardware</Link>
        <Link to="/products?category=components" className="chip">PC Components</Link>
        <Link to="/products?category=laptops" className="chip">Laptops</Link>
        <Link to="/products?category=monitors" className="chip">Monitors</Link>
      </nav>

      <section aria-labelledby="featured-heading">
        <div className="section-header">
          <h2 id="featured-heading" className="section-title">
            Featured Hardware
          </h2>
          <Link to="/products" style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1d4ed8', textDecoration: 'none' }}>
            View All →
          </Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : featured.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <p style={{ margin: '0 0 10px', fontWeight: 600 }}>No hardware listed yet.</p>
            <Link to="/admin" className="btn btn-primary">Add First Product in Admin</Link>
          </div>
        ) : (
          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}