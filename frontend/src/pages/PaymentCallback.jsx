import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ordersApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';

export default function PaymentCallback({ mode }) {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { refreshCart } = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState(null);

  const verifyOrderStatus = useCallback(
    async (signal) => {
      if (!orderId) return;
      setLoading(true);
      try {
        const { data } = await ordersApi.getById(orderId, signal);
        setOrder(data);
        setError(null);
        if (data?.status === 'paid') {
          refreshCart();
        }
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [orderId, refreshCart]
  );

  useEffect(() => {
    const controller = new AbortController();
    verifyOrderStatus(controller.signal);
    return () => controller.abort();
  }, [verifyOrderStatus]);

  return (
    <section className="card" aria-live="polite">
      <h1 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800 }}>
        {mode === 'cancelled' ? 'Payment Cancelled' : 'Payment Verification'}
      </h1>

      {!orderId && (
        <div className="alert alert-warning">
          No order reference provided in callback URL. Check your order history below.
        </div>
      )}

      {loading && <p>Checking authoritative payment status with server...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {order && (
        <div>
          <p><strong>Order ID:</strong> {order.id}</p>
          <p>
            <strong>Authoritative Status:</strong>{' '}
            <span className="badge badge-accent">{order.status}</span>
          </p>
          <p><strong>Total:</strong> {formatCurrency(order.total)}</p>

          {order.status === 'pending_payment' && (
            <div className="alert alert-warning">
              Confirmation is still processing. Tap below to re-verify.
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => verifyOrderStatus()}
            >
              Refresh Status
            </button>
            <Link to={`/orders/${order.id}`} className="btn btn-primary">
              View Order Details
            </Link>
          </div>
        </div>
      )}

      {!order && !loading && (
        <Link to="/orders" className="btn btn-primary" style={{ marginTop: '12px' }}>
          Go to My Orders
        </Link>
      )}
    </section>
  );
}