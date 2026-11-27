import { lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/hooks/useToast';

const HomePage = lazy(() => import('@/pages/HomePage'));
const ShopPage = lazy(() => import('@/pages/ShopPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('@/pages/OrderConfirmationPage'));
const WishlistPage = lazy(() => import('@/pages/WishlistPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const FaqPage = lazy(() => import('@/pages/FaqPage'));
const ShippingReturnsPage = lazy(() => import('@/pages/ShippingReturnsPage'));

const ForgotPasswordPage = lazy(() =>
  import('@/pages/AuthUtilityPages').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/AuthUtilityPages').then((m) => ({ default: m.ResetPasswordPage })),
);
const AuthCallbackPage = lazy(() =>
  import('@/pages/AuthUtilityPages').then((m) => ({ default: m.AuthCallbackPage })),
);
const PrivacyPage = lazy(() =>
  import('@/pages/LegalPages').then((m) => ({ default: m.PrivacyPage })),
);
const TermsPage = lazy(() =>
  import('@/pages/LegalPages').then((m) => ({ default: m.TermsPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/LegalPages').then((m) => ({ default: m.NotFoundPage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, search]);
  return null;
}

function PageFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div className="h-10 w-64 bg-[#eadcd6] rounded-xl animate-pulse mb-6" />
      <div className="h-72 bg-white rounded-3xl border border-[#eadcd6] animate-pulse" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <ErrorBoundary>
              <Layout>
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/shop/:categorySlug" element={<ShopPage />} />
                    <Route path="/search" element={<ShopPage />} />
                    <Route path="/product/:slug" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route
                      path="/order-confirmation/:orderNumber"
                      element={<OrderConfirmationPage />}
                    />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/account/orders" element={<AccountPage />} />
                    <Route path="/account/orders/:orderNumber" element={<AccountPage />} />
                    <Route path="/account/addresses" element={<AccountPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/faq" element={<FaqPage />} />
                    <Route path="/shipping-returns" element={<ShippingReturnsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </Layout>
            </ErrorBoundary>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
