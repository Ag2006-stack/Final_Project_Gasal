import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

export default function Orders() {
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    ordersApi
      .list(controller.signal)
      .then(({ data }) => {
        setOrders(Array.isArray(data) ? data : data?.items || []);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <section aria-labelledby="orders-heading">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h1 id="orders-heading" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
          My Orders
        </h1>
        <button type="button" className="btn btn-outline" onClick={logout}>
          Sign Out
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p>Loading order history...</p>}

      {!loading && orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <p>You have no orders yet.</p>
          <Link to="/products" className="btn btn-primary">
            Explore Hardware
          </Link>
        </div>
      ) : (
        orders.map((order) => (
          <article key={order.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <strong>#{String(order.id).slice(0, 8)}</strong>
              <span className="badge badge-accent">{order.status}</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '10px' }}>
              Total: <strong>{formatCurrency(order.total)}</strong>
            </div>
            <Link to={`/orders/${order.id}`} className="btn btn-outline btn-block">
              View Order Status
            </Link>
          </article>
        ))
      )}
    </section>
  );
}