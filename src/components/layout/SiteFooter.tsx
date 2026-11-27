import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '@/config/site';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/apiClient';

export function SiteFooter() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiClient.subscribeNewsletter({ email: email.trim(), website });
      showToast(res.message || 'Subscribed to Paper Bloom updates.');
      setEmail('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to subscribe', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#181d1a] text-[#eef4ed] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Link to="/" className="font-editorial text-2xl font-semibold text-white">
            Paper <span className="italic text-[#dec0b7]">Bloom</span>
          </Link>
          <p className="mt-3 text-sm text-[#c7d1ca] leading-relaxed">
            {SITE_CONFIG.tagline} from {SITE_CONFIG.city}. Everyday school essentials, custom Bangla &amp; English foil journals, art supplies, books, and thoughtful gift boxes.
          </p>
          <div className="mt-4 text-xs text-[#a8b5ac] space-y-1">
            <p>{SITE_CONFIG.contact.pickupAddress}</p>
            <p>Email: {SITE_CONFIG.contact.email}</p>
            <p>Phone: {SITE_CONFIG.contact.phone}</p>
            <p>{SITE_CONFIG.contact.hours}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#dec0b7] mb-4">
            Shop Collections
          </h2>
          <ul className="space-y-2.5 text-sm text-[#d4ddd7]">
            <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
            <li><Link to="/shop/everyday-stationery" className="hover:text-white transition-colors">Everyday Stationery</Link></li>
            <li><Link to="/shop/custom-studio" className="hover:text-white transition-colors">Custom Studio</Link></li>
            <li><Link to="/shop/aesthetic-stationery" className="hover:text-white transition-colors">Aesthetic Stationery</Link></li>
            <li><Link to="/shop/art-supplies" className="hover:text-white transition-colors">Art Supplies</Link></li>
            <li><Link to="/shop/books-learning" className="hover:text-white transition-colors">Books &amp; Learning</Link></li>
            <li><Link to="/shop/gift-bundles" className="hover:text-white transition-colors">Gift Bundles</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#dec0b7] mb-4">
            Customer Care
          </h2>
          <ul className="space-y-2.5 text-sm text-[#d4ddd7]">
            <li><Link to="/about" className="hover:text-white transition-colors">About Paper Bloom</Link></li>
            <li><Link to="/shipping-returns" className="hover:text-white transition-colors">Delivery Zones &amp; Returns</Link></li>
            <li><Link to="/faq" className="hover:text-white transition-colors">Frequently Asked Questions</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link to="/account/orders" className="hover:text-white transition-colors">Track Demo Orders</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Use</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#dec0b7] mb-4">
            Stationery Notes
          </h2>
          <p className="text-sm text-[#c7d1ca] mb-3">
            Receive quiet updates when new seasonal notebooks, study kits, and art sets arrive.
          </p>
          <form onSubmit={handleSubscribe} className="space-y-2.5">
            <label htmlFor="footer-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-11 px-4 rounded-full bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:bg-white/15"
            />
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              aria-hidden="true"
              className="hidden"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-full bg-[#bf542c] text-white text-sm font-medium hover:bg-[#9f3c16] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-[#a8b5ac]">
          <p>{SITE_CONFIG.demoNotice}</p>
          <p className="whitespace-nowrap">
            &copy; {SITE_CONFIG.foundingYear} {SITE_CONFIG.brandName} · {SITE_CONFIG.city}
          </p>
        </div>
      </div>
    </footer>
  );
}
