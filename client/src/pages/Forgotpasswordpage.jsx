// ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api/apiFunctions.js';
import toast from 'react-hot-toast';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
        console.log('Something went wrong',err);
     toast.error('Something went wrong'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-white font-bold text-lg">T</div>
          <span className="text-xl font-semibold">TeamFlow</span>
        </div>
        <div className="card p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-3">
                <i className="ti ti-mail-check text-green text-2xl" />
              </div>
              <h2 className="font-semibold mb-2">Check your email</h2>
              <p className="text-sm text-muted">If an account exists, we've sent a reset link.</p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold mb-1">Reset password</h1>
              <p className="text-sm text-muted mb-6">Enter your email to receive a reset link</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" placeholder="you@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2">
                  {loading ? <i className="ti ti-loader-2 animate-spin" /> : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-sm text-muted mt-4">
          <Link to="/login" className="text-accent hover:underline flex items-center justify-center gap-1">
            <i className="ti ti-arrow-left text-sm" /> Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;