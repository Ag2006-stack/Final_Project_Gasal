import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNetworkStatus } from '../context/NetworkStatusContext';
import { formatCurrency } from '../utils/formatters';

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isOnline } = useNetworkStatus();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const outOfStock = Number(product.stock ?? 0) <= 0;

  const handleQuickAdd = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      await addItem(product, 1);
    } catch {
      // Handled via cart state
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-img-wrap" aria-label={`View ${product.brand} ${product.name}`}>
        <span className="brand-tag">{product.brand}</span>
        <img
          src={product.imageUrl || '/icons/icon-192x192.png'}
          alt={`${product.brand} ${product.name}`}
          className="product-card-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/icons/icon-192x192.png';
          }}
        />
      </Link>

      <div className="product-card-body">
        <Link to={`/products/${product.id}`} className="product-title">
          {product.name}
        </Link>

        <div className="product-price">{formatCurrency(product.price)}</div>

        <span className="stock-meta">
          <span className={`stock-dot ${outOfStock ? 'out' : ''}`} />
          {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
        </span>

        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ marginTop: 'auto', minHeight: '44px' }}
          disabled={outOfStock || !isOnline || adding}
          onClick={handleQuickAdd}
          aria-label={`Add ${product.brand} ${product.name} to bag`}
        >
          {outOfStock ? 'Sold Out' : !isOnline ? 'Offline' : adding ? 'Adding...' : 'Add to Bag'}
        </button>
      </div>
    </article>
  );
}