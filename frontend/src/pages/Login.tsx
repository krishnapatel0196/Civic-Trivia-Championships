import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { fetchAccountProfile } from '../services/accountsApi';
import type { AuthError } from '../types/auth';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/layout/Header';
import { PillButton } from '../components/ui/PillButton';

export function Login() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');
  const { darkMode } = useTheme();

  // Same palette as the rest of the site (Dashboard/Header) — not the older
  // rust/tan `useTheme().C` tokens this page used to draw from.
  const pageBg = darkMode ? '#0D1117' : '#F0F4F8';
  const ink = darkMode ? '#F1F5F9' : '#0F172A';
  const muted = darkMode ? '#7C90AC' : '#64748B';
  const rule = darkMode ? '#21262D' : '#E2E8F0';
  const inputBg = darkMode ? '#161B22' : '#FFFFFF';
  const accent = darkMode ? '#00C7B1' : '#00657C';
  const incorrect = darkMode ? '#F87171' : '#DC2626';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('ev_refresh_token', response.refresh_token);
      setAuth(response.access_token, response.user);
      fetchAccountProfile(response.access_token)
        .then((profile) => useAuthStore.getState().setDisplayName(profile.display_name))
        .catch(() => {});
      if (from && from.startsWith('/')) {
        navigate(from);
      } else {
        navigate('/');
      }
    } catch (err) {
      const authError = err as AuthError;
      if (authError.errors && authError.errors.length > 0) {
        const errors: Record<string, string> = {};
        authError.errors.forEach((e) => { errors[e.field] = e.message; });
        setFieldErrors(errors);
      } else if (authError.error) {
        setError(authError.error);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    fontFamily: "'Manrope', sans-serif",
    fontSize: '15px',
    color: ink,
    background: inputBg,
    border: `1px solid ${rule}`,
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Manrope', sans-serif",
    fontWeight: 600,
    fontSize: '13px',
    color: muted,
    marginBottom: '6px',
  };

  return (
    <div style={{ minHeight: '100vh', background: pageBg }}>
      <Header />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 'clamp(400px, 30vw, 560px)' }}>

        {/* Masthead */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <img
            src={darkMode ? '/images/civic-trivia-logo-dark.svg' : '/images/civic-trivia-logo-light-2400w.png'}
            alt="Civic Trivia Championship"
            style={{ height: 'clamp(56px, 8vw, 96px)', width: 'auto', margin: '0 auto 20px' }}
          />
          <h1 style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(28px, 2.2vw, 40px)',
            color: ink,
            margin: '0',
            lineHeight: 1,
            letterSpacing: '-0.01em',
          }}>
            Sign In
          </h1>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            marginBottom: '20px',
            padding: '10px 14px',
            border: `1px solid ${incorrect}66`,
            background: darkMode ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.06)',
            borderRadius: '8px',
            fontFamily: "'Manrope', sans-serif",
            fontSize: '13px',
            color: incorrect,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label htmlFor="email" style={labelStyle}>
              Email Address <span style={{ color: incorrect }}>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              style={{ ...inputStyle, borderColor: fieldErrors.email ? incorrect : rule }}
              onFocus={e => (e.currentTarget.style.borderColor = accent)}
              onBlur={e => (e.currentTarget.style.borderColor = fieldErrors.email ? incorrect : rule)}
            />
            {fieldErrors.email && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: incorrect, fontStyle: 'italic' }}>{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" style={labelStyle}>
              Password <span style={{ color: incorrect }}>*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              style={{ ...inputStyle, borderColor: fieldErrors.password ? incorrect : rule }}
              onFocus={e => (e.currentTarget.style.borderColor = accent)}
              onBlur={e => (e.currentTarget.style.borderColor = fieldErrors.password ? incorrect : rule)}
            />
            {fieldErrors.password && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: incorrect, fontStyle: 'italic' }}>{fieldErrors.password}</p>
            )}
          </div>

          <PillButton
            type="submit"
            disabled={loading}
            className="focus-ring-primary"
            style={{ marginTop: '4px', width: '100%', fontWeight: 800 }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </PillButton>
        </form>

        {/* Footer link */}
        <div style={{ borderTop: `1px solid ${rule}`, marginTop: '28px', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: '14px', color: muted, margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
