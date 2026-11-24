import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNetworkStatus } from '../context/NetworkStatusContext';
import { formatCurrency } from '../utils/formatters';

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const { cart, updateQuantity, applyCoupon } = useCart();
  const { isOnline } = useNetworkStatus();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState(cart.couponCode || '');
  const [couponFeedback, setCouponFeedback] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  if (!isAuthenticated) {
    return (
      <section className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
        <h1 style={{ fontSize: '1.25rem' }}>Your Hardware Bag</h1>
        <p style={{ color: '#475569' }}>Sign in to sync your selected components and apply promo codes.</p>
        <Link to="/login" className="btn btn-primary">
          Sign In
        </Link>
      </section>
    );
  }

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim() || !isOnline) return;
    setApplyingCoupon(true);
    setCouponFeedback(null);
    try {
      await applyCoupon(couponInput.trim().toUpperCase());
      setCouponFeedback({ type: 'success', text: 'Promo code applied.' });
    } catch (err) {
      setCouponFeedback({ type: 'error', text: err.message });
    } finally {
      setApplyingCoupon(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <section className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
        <h1 style={{ fontSize: '1.25rem' }}>Your Bag is Empty</h1>
        <p style={{ color: '#475569' }}>Browse components, laptops, and monitors to start your build.</p>
        <Link to="/products" className="btn btn-primary">
          Browse Hardware
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="cart-heading">
      <h1 id="cart-heading" style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 800 }}>
        Shopping Bag
      </h1>

      {cart.items.map((item) => (
        <article key={item.productId} className="card" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <img
            src={item.imageUrl || '/icons/icon-192x192.png'}
            alt={item.name}
            style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', background: '#eef2f7' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
            <div style={{ color: '#1d4ed8', fontWeight: 800 }}>{formatCurrency(item.price)}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="icon-btn btn-outline"
              style={{ padding: 0 }}
              disabled={!isOnline}
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              aria-label={`Decrease quantity of ${item.name}`}
            >
              −
            </button>
            <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
              {item.quantity}
            </span>
            <button
              type="button"
              className="icon-btn btn-outline"
              style={{ padding: 0 }}
              disabled={!isOnline}
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              aria-label={`Increase quantity of ${item.name}`}
            >
              +
            </button>
          </div>
        </article>
      ))}

      <form onSubmit={handleApplyCoupon} className="card">
        <label htmlFor="coupon-code" className="form-label">Promo / Voucher Code</label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <input
            id="coupon-code"
            type="text"
            className="form-input"
            placeholder="e.g. SAVE10"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            disabled={!isOnline || applyingCoupon}
          />
          <button
            type="submit"
            className="btn btn-outline"
            disabled={!isOnline || applyingCoupon || !couponInput.trim()}
          >
            Apply
          </button>
        </div>
        {couponFeedback && (
          <div
            className={`alert ${couponFeedback.type === 'error' ? 'alert-error' : 'alert-success'}`}
            style={{ marginTop: '10px', marginBottom: 0 }}
          >
            {couponFeedback.text}
          </div>
        )}
      </form>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span>Subtotal</span>
          <span>{formatCurrency(cart.subtotal)}</span>
        </div>
        {Number(cart.discount) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#15803d' }}>
            <span>Discount ({cart.couponCode})</span>
            <span>−{formatCurrency(cart.discount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.125rem' }}>
          <span>Server Total</span>
          <span>{formatCurrency(cart.total)}</span>
        </div>
      </div>

      <div className="sticky-action-bar">
        <div>
          <div style={{ fontSize: '0.75rem', color: '#475569' }}>Total</div>
          <div style={{ fontWeight: 800 }}>{formatCurrency(cart.total)}</div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!isOnline}
          onClick={() => navigate('/checkout')}
        >
          {isOnline ? 'Proceed to Checkout' : 'Offline — Checkout Disabled'}
        </button>
      </div>
    </section>
  );
}