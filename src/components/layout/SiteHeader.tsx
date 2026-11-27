import { useEffect, useRef, useState } from 'react';
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  ChevronDown,
  LogOut,
  Package,
  MapPin,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatBdt } from '@shared/format';
import { SITE_CONFIG } from '@/config/site';
import { useAuth } from '@/hooks/useAuth';
import { useCart, useCategories, useHealth, useWishlist } from '@/hooks/useStore';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/apiClient';

const NAV_CATEGORIES = [
  { slug: 'everyday-stationery', label: 'Everyday' },
  { slug: 'aesthetic-stationery', label: 'Aesthetic' },
  { slug: 'custom-studio', label: 'Custom Studio' },
  { slug: 'art-supplies', label: 'Art Supplies' },
  { slug: 'books-learning', label: 'Books & Learning' },
  { slug: 'gift-bundles', label: 'Gift Bundles' },
] as const;

export function SiteHeader() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isDemoMode, isGuest, isAuthenticated, user, signInAsGuest, signOut } = useAuth();
  const { data: health } = useHealth();
  const { data: cart } = useCart();
  const { data: wishlist = [] } = useWishlist();
  const { data: categories = [] } = useCategories();

  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<
    Array<{ slug: string; name: string; categoryName: string; basePriceBdt: number; imageUrl: string }>
  >([]);
  const [accountOpen, setAccountOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  const accountRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isDemo = isDemoMode || health?.mode === 'demo';
  const itemCount = cart?.itemCount ?? 0;
  const subtotal = cart?.pricing.merchandiseSubtotalBdt ?? 0;

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    const q = searchTerm.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      apiClient
        .getSearchSuggestions(q)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 180);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    setSearchOpen(false);
    setSuggestions([]);
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/shop');
    }
  };

  const handleContinueAsGuest = async () => {
    setAccountOpen(false);
    if (isDemoMode) {
      showToast('Demo Preview is active — your bag and wishlist stay in this browser.', 'info');
      return;
    }
    try {
      await signInAsGuest();
      showToast('Guest session started. Your bag is saved in the database.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to start guest session', 'error');
    }
  };

  const handleSignOut = async () => {
    setAccountOpen(false);
    await signOut();
    showToast('Signed out cleanly', 'info');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40">
      {isDemo && (
        <div
          role="region"
          aria-label="Demo mode notice"
          className="bg-[#181d1a] text-[#f6fbf5] text-xs px-4 py-2 text-center leading-snug"
        >
          <span className="font-semibold text-[#f3d6b0]">DEMO PREVIEW</span> — sample data only. Not connected to a database. Carts, wishlists and orders are stored in this browser only and are not real.
        </div>
      )}

      {showAnnouncement && (
        <div className="bg-[#476553] text-white text-xs px-4 h-9 flex items-center justify-center relative">
          <p className="truncate pr-6 text-center">
            {SITE_CONFIG.announcement.text}
          </p>
          <button
            type="button"
            onClick={() => setShowAnnouncement(false)}
            aria-label="Dismiss announcement"
            className="absolute right-3 p-1 rounded hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="bg-[#f6fbf5]/95 backdrop-blur-md border-b border-[#dec0b7]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden w-11 h-11 -ml-2 flex items-center justify-center rounded-xl text-[#181d1a] hover:bg-[#eef4ed]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              to="/"
              className="font-editorial text-xl sm:text-2xl font-semibold tracking-tight text-[#181d1a] whitespace-nowrap shrink-0"
            >
              Paper <span className="italic text-[#9f3c16]">Bloom</span>
            </Link>
          </div>

          <nav aria-label="Primary categories" className="hidden lg:flex items-center gap-5 xl:gap-7">
            {NAV_CATEGORIES.map((item) => {
              const catData = categories.find((c) => c.slug === item.slug);
              const children = catData?.children ?? [];
              return (
                <div
                  key={item.slug}
                  className="relative py-4"
                  onMouseEnter={() => setHoveredCat(item.slug)}
                  onMouseLeave={() => setHoveredCat(null)}
                >
                  <Link
                    to={`/shop/${item.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#181d1a] hover:text-[#9f3c16] transition-colors whitespace-nowrap shrink-0"
                  >
                    {item.label}
                    {children.length > 0 && (
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
                    )}
                  </Link>
                  {hoveredCat === item.slug && children.length > 0 && (
                    <div className="absolute left-0 top-full w-60 bg-white rounded-xl border border-[#dec0b7] shadow-lg p-2 z-50">
                      <Link
                        to={`/shop/${item.slug}`}
                        onClick={() => setHoveredCat(null)}
                        className="block px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#9f3c16] hover:bg-[#faf6f0]"
                      >
                        All {item.label}
                      </Link>
                      {children.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/shop/${sub.slug}`}
                          onClick={() => setHoveredCat(null)}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[#181d1a] hover:bg-[#faf6f0] hover:text-[#9f3c16]"
                        >
                          <span>{sub.name}</span>
                          {sub.productCount !== undefined && (
                            <span className="text-xs text-[#525954] tabular-nums">
                              {sub.productCount}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search stationery catalog"
              aria-expanded={searchOpen}
              className="w-11 h-11 flex items-center justify-center rounded-full text-[#181d1a] hover:bg-[#eef4ed] transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              to="/wishlist"
              aria-label={`Wishlist (${wishlist.length} saved items)`}
              className="relative w-11 h-11 flex items-center justify-center rounded-full text-[#181d1a] hover:bg-[#eef4ed] transition-colors"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#476553] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-label="Account menu"
                aria-expanded={accountOpen}
                className="h-11 px-2.5 flex items-center gap-1.5 rounded-full text-[#181d1a] hover:bg-[#eef4ed] transition-colors text-sm"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline text-xs font-medium whitespace-nowrap">
                  {isDemoMode
                    ? 'Demo'
                    : isAuthenticated && !isGuest
                      ? user?.email?.split('@')[0] || 'Account'
                      : isGuest && isAuthenticated
                        ? 'Guest'
                        : 'Sign in'}
                </span>
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#dec0b7] shadow-xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-[#eadcd6] mb-1">
                    {isDemoMode ? (
                      <>
                        <p className="text-xs font-semibold text-[#9f3c16]">Demo Preview Visitor</p>
                        <p className="text-xs text-[#525954]">
                          Orders and cart stay in this browser.
                        </p>
                      </>
                    ) : isAuthenticated && !isGuest ? (
                      <>
                        <p className="text-xs font-semibold text-[#181d1a] truncate">
                          {user?.email}
                        </p>
                        <p className="text-xs text-[#476553]">Signed-in account</p>
                      </>
                    ) : isGuest && isAuthenticated ? (
                      <>
                        <p className="text-xs font-semibold text-[#181d1a]">Guest Session</p>
                        <p className="text-xs text-[#525954]">
                          Create an account to keep orders across devices.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-[#181d1a]">Welcome to Paper Bloom</p>
                        <p className="text-xs text-[#525954]">Sign in or continue as a guest.</p>
                      </>
                    )}
                  </div>

                  {!isDemoMode && !isAuthenticated && (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setAccountOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm font-medium text-[#181d1a] hover:bg-[#faf6f0]"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setAccountOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm text-[#181d1a] hover:bg-[#faf6f0]"
                      >
                        Create account
                      </Link>
                      <button
                        type="button"
                        onClick={handleContinueAsGuest}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#476553] font-medium hover:bg-[#faf6f0]"
                      >
                        Continue as Guest
                      </button>
                    </>
                  )}

                  {!isDemoMode && isAuthenticated && isGuest && (
                    <Link
                      to="/register"
                      onClick={() => setAccountOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#9f3c16] hover:bg-[#faf6f0]"
                    >
                      Upgrade guest to full account
                    </Link>
                  )}

                  <Link
                    to="/account"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#181d1a] hover:bg-[#faf6f0]"
                  >
                    <User className="w-4 h-4 text-[#525954]" />
                    My Profile
                  </Link>
                  <Link
                    to="/account/orders"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#181d1a] hover:bg-[#faf6f0]"
                  >
                    <Package className="w-4 h-4 text-[#525954]" />
                    My Orders
                  </Link>
                  <Link
                    to="/account/addresses"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#181d1a] hover:bg-[#faf6f0]"
                  >
                    <MapPin className="w-4 h-4 text-[#525954]" />
                    Saved Addresses
                  </Link>

                  {!isDemoMode && isAuthenticated && (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 mt-1 border-t border-[#eadcd6] rounded-lg text-sm text-[#9f3c16] hover:bg-[#fff5f2]"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  )}
                </div>
              )}
            </div>

            <Link
              to="/cart"
              aria-label={`Shopping bag with ${itemCount} items`}
              className="inline-flex items-center gap-2 h-11 px-3.5 rounded-full bg-[#9f3c16] text-white text-xs font-medium hover:bg-[#bf542c] transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span className="tabular-nums font-semibold">{itemCount}</span>
              {subtotal > 0 && (
                <span className="hidden sm:inline tabular-nums border-l border-white/25 pl-2">
                  {formatBdt(subtotal)}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <div className="border-t border-[#eadcd6] bg-white px-4 py-3">
            <div className="max-w-3xl mx-auto relative">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <label htmlFor="header-search-input" className="sr-only">
                  Search stationery, books, and gifts
                </label>
                <input
                  id="header-search-input"
                  ref={searchInputRef}
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notebooks, personalized journals, gouache, storybooks..."
                  className="flex-1 h-11 px-4 rounded-full border border-[#dec0b7] bg-[#f6fbf5] text-sm text-[#181d1a] placeholder:text-[#525954]"
                />
                <button
                  type="submit"
                  className="px-5 h-11 rounded-full bg-[#9f3c16] text-white text-sm font-medium hover:bg-[#bf542c] whitespace-nowrap"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                  className="w-11 h-11 flex items-center justify-center rounded-full border border-[#dec0b7] text-[#525954] hover:bg-[#faf6f0]"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>

              {suggestions.length > 0 && (
                <ul className="mt-2 bg-white rounded-xl border border-[#dec0b7] divide-y divide-[#eadcd6] shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <li key={s.slug}>
                      <Link
                        to={`/product/${s.slug}`}
                        onClick={() => {
                          setSearchOpen(false);
                          setSuggestions([]);
                        }}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-[#faf6f0]"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#181d1a]">{s.name}</p>
                          <p className="text-xs text-[#476553]">{s.categoryName}</p>
                        </div>
                        <span className="text-sm font-semibold text-[#181d1a] tabular-nums">
                          {formatBdt(s.basePriceBdt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile slide-in navigation drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            aria-label="Mobile menu"
            className="relative z-10 w-80 max-w-[85vw] bg-[#f6fbf5] h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#dec0b7]">
                <span className="font-editorial text-xl font-semibold text-[#181d1a]">
                  Paper <span className="italic text-[#9f3c16]">Bloom</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#eef4ed]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ul className="mt-4 space-y-1">
                <li>
                  <Link
                    to="/shop"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-3 rounded-xl text-base font-medium text-[#9f3c16] hover:bg-[#eef4ed]"
                  >
                    Shop All Products
                  </Link>
                </li>
                {NAV_CATEGORIES.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={`/shop/${item.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-3 rounded-xl text-base font-medium text-[#181d1a] hover:bg-[#eef4ed]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4 border-t border-[#dec0b7] space-y-1 text-sm">
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-[#525954] hover:bg-[#eef4ed]"
                >
                  About Paper Bloom
                </Link>
                <Link
                  to="/shipping-returns"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-[#525954] hover:bg-[#eef4ed]"
                >
                  Delivery &amp; Returns
                </Link>
                <Link
                  to="/faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-[#525954] hover:bg-[#eef4ed]"
                >
                  FAQ
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-[#525954] hover:bg-[#eef4ed]"
                >
                  Contact
                </Link>
              </div>
            </div>

            {!isDemoMode && !isAuthenticated && (
              <div className="pt-4 border-t border-[#dec0b7] flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center rounded-full bg-[#9f3c16] text-white text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center rounded-full border border-[#dec0b7] text-[#181d1a] text-sm font-medium"
                >
                  Create account
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
