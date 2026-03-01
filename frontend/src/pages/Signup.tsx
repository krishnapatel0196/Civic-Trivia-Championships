import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import type { AuthError } from '../types/auth';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      // Signup — accounts API accepts only { email, password }
      await authService.signup({ email, password });

      // Auto-login after successful signup
      const loginResponse = await authService.login({ email, password });
      localStorage.setItem('ev_refresh_token', loginResponse.refresh_token);
      setAuth(loginResponse.access_token, loginResponse.user);
      // Always navigate to / after signup — Inform-tier users can't access /profile,
      // so navigating to from would create a redirect loop.
      navigate('/');
    } catch (err) {
      const authError = err as AuthError;

      if (authError.errors && authError.errors.length > 0) {
        const errors: Record<string, string> = {};
        authError.errors.forEach((e) => {
          errors[e.field] = e.message;
        });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-slate-800/50 border border-slate-700 shadow-lg rounded-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Join Civic Trivia Championship today
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-md">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            placeholder="Create a strong password"
            autoComplete="new-password"
            required
          />

          <div className="pt-2">
            <Button type="submit" loading={loading} disabled={loading}>
              Create account
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link
              to={from ? `/login?from=${encodeURIComponent(from)}` : '/login'}
              className="font-medium text-teal-400 hover:text-teal-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
