import { useRef, useState } from 'react';
import { checkoutApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useNetworkStatus } from '../context/NetworkStatusContext';
import { formatCurrency, generateIdempotencyKey } from '../utils/formatters';
import { validateShippingForm } from '../utils/validators';

export default function Checkout() {
  const { cart } = useCart();
  const { isOnline } = useNetworkStatus();

  const [shipping, setShipping] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    notes: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const idempotencyKeyRef = useRef(generateIdempotencyKey());

  const handleChange = (field) => (e) => {
    setShipping((prev) => ({ ...prev, [field]: e.target.value }));
    idempotencyKeyRef.current = generateIdempotencyKey();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOnline || submitting) return;

    const validation = validateShippingForm(shipping);
    setFieldErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    setApiError(null);

    try {
      const { data } = await checkoutApi.createSession(
        {
          shippingAddress: shipping,
          couponCode: cart.couponCode || undefined
        },
        idempotencyKeyRef.current
      );

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setApiError('Payment gateway URL missing from server response.');
        setSubmitting(false);
      }
    } catch (err) {
      if (err.status === 409) {
        setApiError(`Stock conflict: ${err.message}. Please review your bag quantities.`);
      } else if (err.status === 422) {
        setApiError(`Validation error: ${err.message}`);
      } else {
        setApiError(err.message);
      }
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="checkout-heading">
      <h1 id="checkout-heading" style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 800 }}>
        Shipping & Maya Checkout
      </h1>

      {apiError && (
        <div className="alert alert-error" role="alert">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" noValidate>
        <div className="form-group">
          <label htmlFor="ship-name" className="form-label">Recipient Full Name</label>
          <input
            id="ship-name"
            type="text"
            className="form-input"
            value={shipping.fullName}
            onChange={handleChange('fullName')}
            required
          />
          {fieldErrors.fullName && <span style={{ color: '#dc2626', fontSize: '0.8125rem' }}>{fieldErrors.fullName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="ship-phone" className="form-label">Mobile Number</label>
          <input
            id="ship-phone"
            type="tel"
            className="form-input"
            placeholder="09171234567"
            value={shipping.phone}
            onChange={handleChange('phone')}
            required
          />
          {fieldErrors.phone && <span style={{ color: '#dc2626', fontSize: '0.8125rem' }}>{fieldErrors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="ship-address" className="form-label">Street / Barangay Address</label>
          <input
            id="ship-address"
            type="text"
            className="form-input"
            value={shipping.addressLine}
            onChange={handleChange('addressLine')}
            required
          />
          {fieldErrors.addressLine && <span style={{ color: '#dc2626', fontSize: '0.8125rem' }}>{fieldErrors.addressLine}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="ship-city" className="form-label">City / Municipality</label>
          <input
            id="ship-city"
            type="text"
            className="form-input"
            value={shipping.city}
            onChange={handleChange('city')}
            required
          />
          {fieldErrors.city && <span style={{ color: '#dc2626', fontSize: '0.8125rem' }}>{fieldErrors.city}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="ship-notes" className="form-label">Delivery Notes (Optional)</label>
          <input
            id="ship-notes"
            type="text"
            className="form-input"
            value={shipping.notes}
            onChange={handleChange('notes')}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginBottom: '14px' }}>
          <span>Amount Due</span>
          <span>{formatCurrency(cart.total)}</span>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={!isOnline || submitting || cart.items.length === 0}
        >
          {!isOnline
            ? 'Offline — Payment Unavailable'
            : submitting
              ? 'Redirecting to Maya...'
              : 'Pay via Maya Sandbox'}
        </button>
      </form>
    </section>
  );
}