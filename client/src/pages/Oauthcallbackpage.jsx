import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../zustand/authStore.js';

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens, updateUser } = useAuthStore();

  useEffect(() => {
    const accessToken  = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const error        = params.get('error');

    if (error || !accessToken) {
      navigate('/login?error=oauth_failed');
      return;
    }

    // Hydrate the auth store exactly like a normal login response
    const user = {
      _id:             params.get('userId'),
      name:            params.get('name'),
      email:           params.get('email'),
      avatar:          params.get('avatar') || '',
      role:            params.get('role'),
      isEmailVerified: params.get('isEmailVerified') === 'true',
    };

    useAuthStore.setState({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
    });

    navigate('/', { replace: true });
  }, [navigate,params]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-white font-bold text-lg">T</div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <i className="ti ti-loader-2 animate-spin text-accent text-lg" />
          Signing you in with Google…
        </div>
      </div>
    </div>
  );
}