import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { IconArrowLeft, IconBag, IconCpu } from './Icons';

export default function Header() {
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const showBack = location.pathname !== '/';

  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {showBack && (
          <button
            type="button"
            className="icon-btn btn-ghost-dark"
            style={{ padding: 0 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <IconArrowLeft />
          </button>
        )}
        <Link to="/" className="brand-link">
          <span className="brand-mark">
            <IconCpu size={15} />
          </span>
          <span>CoreSpec</span>
        </Link>
      </div>

      <Link
        to="/cart"
        className="header-cart-btn"
        aria-label={`Shopping bag with ${itemCount} items`}
      >
        <IconBag size={16} />
        <span>Bag</span>
        <span className="cart-pill">{itemCount}</span>
      </Link>
    </header>
  );
}