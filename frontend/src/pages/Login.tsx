import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import type { AuthError } from '../types/auth';
import { useTheme } from '../hooks/useTheme';

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
  const { C } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('ev_refresh_token', response.refresh_token);
      setAuth(response.access_token, response.user);
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
    padding: '10px 12px',
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '15px',
    color: C.ink,
    background: C.paper,
    border: `1px solid ${C.rule}`,
    borderRadius: '2px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Bebas Neue', sans-serif",
    letterSpacing: '0.14em',
    fontSize: '12px',
    color: C.muted,
    marginBottom: '6px',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Masthead */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <p style={{
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '0.28em',
            fontSize: '11px',
            color: C.muted,
            margin: '0 0 10px',
          }}>
            CIVIC TRIVIA CHAMPIONSHIP
          </p>
          <div style={{ borderTop: `1px solid ${C.rule}` }} />
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '32px',
            letterSpacing: '0.06em',
            color: C.ink,
            margin: '16px 0 0',
            lineHeight: 1,
          }}>
            Sign In
          </h1>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            marginBottom: '20px',
            padding: '10px 14px',
            border: `1px solid rgba(192,21,42,0.4)`,
            background: 'rgba(192,21,42,0.06)',
            borderRadius: '2px',
            fontFamily: "'Lora', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '13px',
            color: C.incorrect,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label htmlFor="email" style={labelStyle}>
              Email Address <span style={{ color: C.accent }}>*</span>
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
              style={{ ...inputStyle, borderColor: fieldErrors.email ? C.incorrect : C.rule }}
              onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={e => (e.currentTarget.style.borderColor = fieldErrors.email ? C.incorrect : C.rule)}
            />
            {fieldErrors.email && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.incorrect, fontStyle: 'italic' }}>{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" style={labelStyle}>
              Password <span style={{ color: C.accent }}>*</span>
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
              style={{ ...inputStyle, borderColor: fieldErrors.password ? C.incorrect : C.rule }}
              onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={e => (e.currentTarget.style.borderColor = fieldErrors.password ? C.incorrect : C.rule)}
            />
            {fieldErrors.password && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.incorrect, fontStyle: 'italic' }}>{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              padding: '14px',
              width: '100%',
              minHeight: '48px',
              background: loading ? C.rule : C.accent,
              color: '#FFFFFF',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '18px',
              letterSpacing: '0.14em',
              border: 'none',
              borderRadius: '2px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = C.accentHover; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = C.accent; }}
          >
            {loading ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </form>

        {/* Footer link */}
        <div style={{ borderTop: `1px solid ${C.rule}`, marginTop: '28px', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Lora', Georgia, serif", fontStyle: 'italic', fontSize: '14px', color: C.muted, margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: C.accent, textDecoration: 'none', fontStyle: 'normal' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
