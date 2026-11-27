import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    isDemoMode,
    isAuthenticated,
    isGuest,
    googleEnabled,
    registerWithEmail,
    upgradeGuestWithGoogle,
  } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  const upgradingGuest = !isDemoMode && isAuthenticated && isGuest;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < 8) {
      setErrorMsg('Please choose a password of at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await registerWithEmail({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      if (res.needsEmailConfirmation) {
        setConfirmationSent(true);
        showToast('Check your email to confirm your account');
      } else {
        showToast(upgradingGuest ? 'Guest session upgraded to your account' : 'Account created');
        navigate('/account');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title={upgradingGuest ? 'Save Your Guest Account' : 'Create Account'}
        description="Register for a Paper Bloom account."
      />

      <div className="max-w-md mx-auto px-4 py-14">
        <div className="rounded-3xl bg-white border border-[#dec0b7] p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="font-editorial text-3xl text-[#181d1a]">
              {upgradingGuest ? 'Save your guest account' : 'Create an account'}
            </h1>
            <p className="text-sm text-[#525954] mt-1">
              {upgradingGuest
                ? 'Keep your current shopping bag, wishlist, and demo orders across devices.'
                : 'Save addresses in Dhaka and across Bangladesh for faster demonstration checkouts.'}
            </p>
          </div>

          {isDemoMode && (
            <div className="rounded-2xl bg-[#faf6f0] border border-[#9f3c16]/40 p-4 text-xs text-[#181d1a] space-y-1">
              <p className="font-semibold text-[#9f3c16]">Demo Preview Active</p>
              <p className="text-[#525954]">
                Account registration becomes active once Supabase credentials are added to <code className="font-mono">.env</code> (see README).
              </p>
            </div>
          )}

          {confirmationSent ? (
            <div className="rounded-2xl bg-[#eef4ed] border border-[#476553]/40 p-5 space-y-2 text-sm">
              <p className="font-semibold text-[#476553]">Confirmation email sent</p>
              <p className="text-xs text-[#525954]">
                Please open the verification link sent to <strong>{email}</strong>, then sign in.
              </p>
              <Link to="/login" className="inline-block text-xs font-semibold text-[#9f3c16] underline">
                Go to Sign in &rarr;
              </Link>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div role="alert" className="rounded-xl bg-[#fff5f2] border border-[#9f3c16]/40 p-3 text-xs text-[#7d2c0e]">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-[#181d1a] mb-1">
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    disabled={isDemoMode}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tasnim Ahmed"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm disabled:opacity-60"
                  />
                </div>

                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-semibold text-[#181d1a] mb-1">
                    Mobile Number (optional)
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    disabled={isDemoMode}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01712345678"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm disabled:opacity-60"
                  />
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-[#181d1a] mb-1">
                    Email address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    disabled={isDemoMode}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm disabled:opacity-60"
                  />
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-xs font-semibold text-[#181d1a] mb-1">
                    Password (minimum 8 characters)
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={8}
                    disabled={isDemoMode}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm disabled:opacity-60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || isDemoMode}
                  className="w-full h-11 rounded-full bg-[#9f3c16] text-white text-sm font-semibold hover:bg-[#bf542c] disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : upgradingGuest
                      ? 'Upgrade & Keep My Bag'
                      : 'Create Account'}
                </button>
              </form>

              {googleEnabled && (
                <button
                  type="button"
                  onClick={() => upgradeGuestWithGoogle().catch((e) => setErrorMsg(e.message))}
                  className="w-full h-11 rounded-full border border-[#dec0b7] text-sm font-medium text-[#181d1a] hover:bg-[#faf6f0]"
                >
                  {upgradingGuest ? 'Link Google Account' : 'Continue with Google'}
                </button>
              )}
            </>
          )}

          <p className="text-xs text-center text-[#525954]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#9f3c16] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
