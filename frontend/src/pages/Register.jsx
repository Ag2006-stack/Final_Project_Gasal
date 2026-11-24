import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from '../context/NetworkStatusContext';
import { validateEmail } from '../utils/validators';

export default function Register() {
  const { register } = useAuth();
  const { isOnline } = useNetworkStatus();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Full name is required.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="register-heading">
      <h1 id="register-heading" style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 800 }}>
        Create CoreSpec Account
      </h1>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <form onSubmit={handleSubmit} className="card" noValidate>
        <div className="form-group">
          <label htmlFor="reg-name" className="form-label">Full Name</label>
          <input
            id="reg-name"
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="reg-email" className="form-label">Email Address</label>
          <input
            id="reg-email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="reg-password" className="form-label">Password (min 8 chars)</label>
          <input
            id="reg-password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={!isOnline || submitting}
        >
          {!isOnline ? 'Offline' : submitting ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: '0.9375rem' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </section>
  );
}