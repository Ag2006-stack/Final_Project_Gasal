import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconGrid, IconHome, IconPackage, IconSparkles, IconUser } from './Icons';

export default function BottomNav() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <nav className="bottom-nav" aria-label="Primary mobile navigation">
      <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <IconHome />
        <span>Home</span>
        <span className="nav-indicator" />
      </NavLink>

      <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <IconGrid />
        <span>Catalog</span>
        <span className="nav-indicator" />
      </NavLink>

      <NavLink to="/ai-assistant" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <IconSparkles />
        <span>Spec AI</span>
        <span className="nav-indicator" />
      </NavLink>

      <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <IconPackage />
        <span>Orders</span>
        <span className="nav-indicator" />
      </NavLink>

      <NavLink
        to={isAdmin ? '/admin' : isAuthenticated ? '/orders' : '/login'}
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <IconUser />
        <span>{isAdmin ? 'Admin' : isAuthenticated ? 'Account' : 'Sign In'}</span>
        <span className="nav-indicator" />
      </NavLink>
    </nav>
  );
}