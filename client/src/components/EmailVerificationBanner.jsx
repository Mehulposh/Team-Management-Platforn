import { useState } from 'react';
import { useAuthStore } from '../zustand/authStore.js';
import api from '../api/apiInstance.js';
import toast from 'react-hot-toast';

export default function EmailVerificationBanner() {
  const { user, updateUser } = useAuthStore();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.isEmailVerified) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await api.post('/auth/resend-verification');
      setSent(true);
      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send email');
    }
    setSending(false);
  };

  return (
    <div className="bg-amber/10 border-b border-amber/20 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
      <i className="ti ti-alert-circle text-amber text-base flex-shrink-0" />
      <p className="text-xs text-amber flex-1">
        Your email address is not verified. Please check your inbox or{' '}
        <button
          onClick={handleResend}
          disabled={sending || sent}
          className="underline font-medium hover:no-underline disabled:opacity-50"
        >
          {sending ? 'Sending…' : sent ? 'Email sent ✓' : 'resend verification email'}
        </button>
        .
      </p>
      <button
        onClick={() => updateUser({ _bannerDismissed: true })}
        className="text-amber/60 hover:text-amber ml-2 flex-shrink-0"
      >
        <i className="ti ti-x text-sm" />
      </button>
    </div>
  );
}