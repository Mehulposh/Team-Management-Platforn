import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../api/apiFunctions.js';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();

  const token = params.get('token');

  const [status, setStatus] = useState(
    token ? 'loading' : 'error'
  );

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        await authAPI.verifyEmail(token);
        setStatus('success');
      } catch (err) {
        console.log(err);
        setStatus('error');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="card p-8 text-center max-w-sm w-full">
        {status === 'loading' && (
          <i className="ti ti-loader-2 animate-spin text-3xl text-accent" />
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-3">
              <i className="ti ti-check text-green text-2xl" />
            </div>

            <h2 className="font-semibold text-lg mb-2">
              Email verified!
            </h2>

            <p className="text-sm text-muted mb-4">
              Your account is now active.
            </p>

            <Link to="/login" className="btn-primary">
              Continue to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-3">
              <i className="ti ti-x text-danger text-2xl" />
            </div>

            <h2 className="font-semibold text-lg mb-2">
              Invalid link
            </h2>

            <p className="text-sm text-muted mb-4">
              This verification link is invalid or expired.
            </p>

            <Link to="/login" className="btn-secondary">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}