import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../context/useAuth';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, user } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    tenant_name: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/');
    }
  }, [isLoading, navigate, user]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register({ ...form, tenant_name: form.tenant_name || undefined });
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('This email is already registered. Try signing in instead.');
      } else {
        setError('Unable to create your account. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <p className="eyebrow">Create account</p>
        <h2>Join Workspace</h2>
        <p className="subtitle">Spin up a secure space for your team in seconds.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="full_name">Full Name</label>
          <input
            id="full_name"
            name="full_name"
            className="form-input"
            value={form.full_name}
            onChange={handleChange}
            required
          />
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
          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="form-input"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
          <label className="form-label" htmlFor="tenant_name">Workspace Name</label>
          <input
            id="tenant_name"
            name="tenant_name"
            className="form-input"
            value={form.tenant_name}
            onChange={handleChange}
            placeholder="Product Team Workspace"
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
};

export default Register;
