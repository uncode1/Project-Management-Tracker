import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, type Location } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../context/useAuth';

interface LocationState {
  from?: Location;
}

const SAVED_EMAIL_KEY = 'pmt.login-email';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, user } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as LocationState | undefined)?.from?.pathname || '/';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      navigate(from, { replace: true });
    }
  }, [from, isLoading, navigate, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login({ ...form });
      if (rememberMe) {
        localStorage.setItem(SAVED_EMAIL_KEY, form.email);
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('Unable to sign in. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const valueProps = useMemo(() => ([
    'Enterprise-grade security with SSO and audit trails.',
    'Real-time dashboards and AI-powered insights for every board.',
    'Collaboration tools built for globally distributed teams.',
  ]), []);

  return (
    <div className="auth-layout split">
      <section className="auth-card">
        <div className="auth-card-header">
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in to Workspace</h2>
          <p className="subtitle">Pick up where you left off—cards, dashboards, and teammates are waiting.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="password">Password</label>
              <button
                type="button"
                className="link-button"
                onClick={() => alert('Password reset is coming soon.')}
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>
          <label className="remember-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>Remember me on this device</span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="auth-footer">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </section>

      <aside className="auth-sidecard">
        <p className="eyebrow">Project Management Tracker</p>
        <h2>Trusted by product squads shipping seven-figure roadmaps.</h2>
        <div className="stat-grid">
          <div>
            <p className="stat-label">Median rollout speed</p>
            <p className="stat-value">27% faster</p>
          </div>
          <div>
            <p className="stat-label">Weekly standups saved</p>
            <p className="stat-value">3 hrs</p>
          </div>
          <div>
            <p className="stat-label">Leader confidence</p>
            <p className="stat-value">98%</p>
          </div>
        </div>
        <ul className="value-list">
          {valueProps.map((item) => (
            <li key={item}>
              <span aria-hidden="true" className="value-dot" />
              {item}
            </li>
          ))}
        </ul>
        <p className="eyebrow">Need help?</p>
        <p className="subtitle">Reach out to support@workspace.dev for onboarding assistance.</p>
      </aside>
    </div>
  );
};

export default Login;
