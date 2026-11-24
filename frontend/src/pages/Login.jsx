import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from '../context/NetworkStatusContext';
import { validateEmail } from '../utils/validators';

export default function Login() {
  const { login } = useAuth();
  const { isOnline } = useNetworkStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="login-heading">
      <h1 id="login-heading" style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 800 }}>
        Sign In to CoreSpec
      </h1>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <form onSubmit={handleSubmit} className="card" noValidate>
        <div className="form-group">
          <label htmlFor="login-email" className="form-label">Email Address</label>
          <input
            id="login-email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password" className="form-label">Password</label>
          <input
            id="login-password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={!isOnline || submitting}
        >
          {!isOnline ? 'Offline — Sign In Disabled' : submitting ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: '0.9375rem' }}>
        New to CoreSpec? <Link to="/register">Create an account</Link>
      </p>
    </section>
  );
}