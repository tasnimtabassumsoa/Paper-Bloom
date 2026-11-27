import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isDemoMode, googleEnabled, signInWithEmail, signInWithGoogle, signInAsGuest } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
      showToast('Welcome back to Paper Bloom');
      navigate('/account');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    setErrorMsg('');
    try {
      await signInAsGuest();
      showToast('Guest session active');
      navigate('/shop');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to start guest session');
    }
  };

  return (
    <>
      <PageMeta title="Sign In" description="Sign in to your Paper Bloom account." />

      <div className="max-w-md mx-auto px-4 py-14">
        <div className="rounded-3xl bg-white border border-[#dec0b7] p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="font-editorial text-3xl text-[#181d1a]">Sign in</h1>
            <p className="text-sm text-[#525954] mt-1">
              Access your saved addresses, wishlist, and demo order history.
            </p>
          </div>

          {isDemoMode && (
            <div className="rounded-2xl bg-[#faf6f0] border border-[#9f3c16]/40 p-4 text-xs text-[#181d1a] space-y-1">
              <p className="font-semibold text-[#9f3c16]">Demo Preview Active</p>
              <p className="text-[#525954]">
                Real customer sign-in requires connecting your Supabase project in <code className="font-mono">.env</code> (see README Steps 3–7). You can still browse, save wishlists, and place demonstration orders in this browser without signing in.
              </p>
              <Link to="/shop" className="inline-block mt-1 font-semibold text-[#9f3c16] underline">
                Continue browsing in Demo Mode &rarr;
              </Link>
            </div>
          )}

          {errorMsg && (
            <div role="alert" className="rounded-xl bg-[#fff5f2] border border-[#9f3c16]/40 p-3 text-xs text-[#7d2c0e]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-[#181d1a] mb-1">
                Email address
              </label>
              <input
                id="login-email"
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
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="login-password" className="text-xs font-semibold text-[#181d1a]">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-[#9f3c16] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                required
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
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {googleEnabled && (
            <button
              type="button"
              onClick={() => signInWithGoogle().catch((e) => setErrorMsg(e.message))}
              className="w-full h-11 rounded-full border border-[#dec0b7] text-sm font-medium text-[#181d1a] hover:bg-[#faf6f0]"
            >
              Continue with Google
            </button>
          )}

          {!isDemoMode && (
            <button
              type="button"
              onClick={handleGuest}
              className="w-full h-11 rounded-full border border-[#476553] text-sm font-medium text-[#476553] hover:bg-[#eef4ed]"
            >
              Continue as Guest
            </button>
          )}

          <p className="text-xs text-center text-[#525954]">
            New to Paper Bloom?{' '}
            <Link to="/register" className="text-[#9f3c16] font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
