import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../zustand/authStore.js';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(form);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-white font-bold text-lg">T</div>
          <span className="text-xl font-semibold">TeamFlow</span>
        </div>

        <div className="card p-6">
          <h1 className="text-lg font-semibold mb-1">Welcome back</h1>
          <p className="text-sm text-muted mb-6">Sign in to your workspace</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-accent hover:underline">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2">
              {loading ? <i className="ti ti-loader-2 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs text-muted">
              <span className="bg-surface px-2">or continue with</span>
            </div>
          </div>

          <a
            href="/api/auth/google"
            className="btn-secondary w-full justify-center py-2"
          >
            <i className="ti ti-brand-google text-base" />
            Google
          </a>
        </div>

        <p className="text-center text-sm text-muted mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}