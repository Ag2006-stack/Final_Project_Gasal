import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNetworkStatus } from '../context/NetworkStatusContext';
import { formatCurrency } from '../utils/formatters';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isOnline } = useNetworkStatus();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    productsApi
      .getById(id, controller.signal)
      .then(({ data }) => {
        setProduct(data);
        setFeedback(null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setFeedback({ type: 'error', text: err.message });
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await addItem(product, quantity);
      setFeedback({ type: 'success', text: 'Added to bag.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="skeleton" style={{ height: '320px', width: '100%' }} />;
  }

  if (!product) {
    return <div className="alert alert-error">{feedback?.text || 'Product not found.'}</div>;
  }

  const maxStock = Number(product.stock ?? 0);
  const outOfStock = maxStock <= 0;

  return (
    <article>
      <img
        src={product.imageUrl || '/icons/icon-512x512.png'}
        alt={`${product.brand} ${product.name}`}
        style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: '14px', background: '#eef2f7' }}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/icons/icon-512x512.png';
        }}
      />

      <div style={{ marginTop: '14px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span className="badge badge-accent">{product.brand}</span>
          <span className="badge">{product.category}</span>
        </div>
        <h1 style={{ margin: '8px 0 4px', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          {product.name}
        </h1>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1d4ed8' }}>
          {formatCurrency(product.price)}
        </div>
        <p style={{ color: '#475569' }}>{product.description}</p>
        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
          Availability: {outOfStock ? 'Out of stock' : `${maxStock} units available`}
        </p>
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </div>
      )}

      <div className="sticky-action-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="icon-btn btn-outline"
            style={{ padding: 0 }}
            disabled={quantity <= 1 || outOfStock}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span aria-live="polite" style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700 }}>
            {quantity}
          </span>
          <button
            type="button"
            className="icon-btn btn-outline"
            style={{ padding: 0 }}
            disabled={quantity >= maxStock || outOfStock}
            onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={outOfStock || !isOnline || submitting}
          onClick={handleAddToCart}
        >
          {outOfStock ? 'Out of Stock' : !isOnline ? 'Offline' : submitting ? 'Adding...' : 'Add to Bag'}
        </button>
      </div>
    </article>
  );
}