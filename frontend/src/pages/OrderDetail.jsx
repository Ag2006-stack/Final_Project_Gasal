import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ordersApi } from '../api/endpoints';
import { formatCurrency } from '../utils/formatters';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    ordersApi
      .getById(id, controller.signal)
      .then(({ data }) => {
        setOrder(data);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  if (loading) return <p>Loading order details...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!order) return <div className="alert alert-error">Order not found.</div>;

  return (
    <section aria-labelledby="order-detail-heading">
      <h1 id="order-detail-heading" style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 800 }}>
        Order Details
      </h1>

      <div className="card">
        <p style={{ margin: '0 0 6px' }}><strong>Reference:</strong> {order.id}</p>
        <p style={{ margin: '0 0 6px' }}>
          <strong>Payment Status:</strong> <span className="badge badge-accent">{order.status}</span>
        </p>
        <p style={{ margin: 0 }}>
          <strong>Total:</strong> {formatCurrency(order.total)}
        </p>
      </div>

      <h2 style={{ fontSize: '1.05rem', margin: '14px 0 8px' }}>Items</h2>
      {(order.items || []).map((item, idx) => (
        <div key={item.productId || idx} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{item.name} × {item.quantity}</span>
          <strong>{formatCurrency(item.price * item.quantity)}</strong>
        </div>
      ))}
    </section>
  );
}