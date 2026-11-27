import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getSupabaseClient } from '@/lib/supabaseClient';

export function ForgotPasswordPage() {
  const { isDemoMode, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send reset email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta title="Reset Password" description="Request a password reset email." />
      <div className="max-w-md mx-auto px-4 py-14">
        <div className="rounded-3xl bg-white border border-[#dec0b7] p-6 sm:p-8 space-y-5">
          <h1 className="font-editorial text-3xl text-[#181d1a]">Forgot password</h1>
          {sent ? (
            <p className="text-sm text-[#476553]">
              If an account matches <strong>{email}</strong>, a password reset link has been sent.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <p role="alert" className="text-xs text-[#9f3c16]">{errorMsg}</p>
              )}
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-semibold mb-1">
                  Account Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  disabled={isDemoMode}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || isDemoMode}
                className="w-full h-11 rounded-full bg-[#9f3c16] text-white text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
          <Link to="/login" className="block text-xs text-center text-[#9f3c16] hover:underline">
            Back to Sign in
          </Link>
        </div>
      </div>
    </>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { updatePassword, isDemoMode } = useAuth();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      showToast('Password updated');
      navigate('/account');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta title="Choose New Password" />
      <div className="max-w-md mx-auto px-4 py-14">
        <div className="rounded-3xl bg-white border border-[#dec0b7] p-6 sm:p-8 space-y-5">
          <h1 className="font-editorial text-3xl text-[#181d1a]">Set new password</h1>
          {errorMsg && <p className="text-xs text-[#9f3c16]">{errorMsg}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-pw" className="block text-xs font-semibold mb-1">
                New Password
              </label>
              <input
                id="new-pw"
                type="password"
                required
                minLength={8}
                disabled={isDemoMode}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || isDemoMode}
              className="w-full h-11 rounded-full bg-[#9f3c16] text-white text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => {
      navigate('/account', { replace: true });
    }, 600);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <p className="font-editorial text-2xl text-[#181d1a]">Completing sign-in...</p>
      <p className="text-xs text-[#525954] mt-2">Taking you to your Paper Bloom account.</p>
    </div>
  );
}
