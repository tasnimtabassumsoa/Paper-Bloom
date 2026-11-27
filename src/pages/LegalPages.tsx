import { PageMeta } from '@/components/ui/PageMeta';
import { SITE_CONFIG } from '@/config/site';

export function PrivacyPage() {
  return (
    <>
      <PageMeta title="Privacy Policy" description="Paper Bloom Privacy Policy template." />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-5">
        <div className="rounded-2xl bg-[#faf6f0] border border-[#dec0b7] p-4 text-xs text-[#9f3c16] font-medium">
          Template Notice: Please review and tailor this plain-language policy with a qualified legal advisor before launching a commercial store.
        </div>
        <h1 className="font-editorial text-4xl text-[#181d1a]">Privacy Policy</h1>
        <div className="bg-white rounded-3xl border border-[#dec0b7] p-6 sm:p-8 space-y-4 text-sm text-[#525954] leading-relaxed">
          <p>
            {SITE_CONFIG.brandName} collects only the information needed to manage your shopping bag, saved wishlist, delivery addresses, and demonstration orders (such as your name, mobile number, delivery address, and optional email address).
          </p>
          <p>
            When running in connected database mode, authentication and data access are protected using Supabase Authentication and Postgres Row Level Security so each visitor or account holder can access only their own records. In Demo Preview mode, cart and demonstration order details remain solely in your browser&apos;s local storage.
          </p>
          <p>
            We do not embed third-party advertising trackers or sell personal contact details. For questions or data removal requests, write to {SITE_CONFIG.contact.email}.
          </p>
        </div>
      </div>
    </>
  );
}

export function TermsPage() {
  return (
    <>
      <PageMeta title="Terms of Use" description="Paper Bloom Terms of Use template." />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-5">
        <div className="rounded-2xl bg-[#faf6f0] border border-[#dec0b7] p-4 text-xs text-[#9f3c16] font-medium">
          Template Notice: Please review and tailor these terms with a qualified legal advisor before launching a commercial store.
        </div>
        <h1 className="font-editorial text-4xl text-[#181d1a]">Terms of Use</h1>
        <div className="bg-white rounded-3xl border border-[#dec0b7] p-6 sm:p-8 space-y-4 text-sm text-[#525954] leading-relaxed">
          <p>
            <strong>Demonstration Storefront:</strong> {SITE_CONFIG.demoNotice}
          </p>
          <p>
            <strong>Pricing &amp; Personalization:</strong> All prices are listed in Bangladeshi Taka (BDT, ৳). Custom name stamping and printing requests must stay within character limits and contain lawful, non-offensive wording.
          </p>
          <p>
            <strong>Returns:</strong> Standard unused items are eligible for return within 7 days of delivery; personalized items are non-returnable except for manufacturing or engraving errors made by us.
          </p>
        </div>
      </div>
    </>
  );
}

export function NotFoundPage() {
  return (
    <>
      <PageMeta title="Page Not Found" />
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#476553]">404</p>
        <h1 className="font-editorial text-4xl text-[#181d1a]">This page could not be found</h1>
        <p className="text-sm text-[#525954]">
          The link you followed may have moved. Explore our stationery collections instead.
        </p>
        <div className="pt-2">
          <a
            href="/"
            className="inline-flex px-6 py-3 rounded-full bg-[#9f3c16] text-white text-sm font-medium hover:bg-[#bf542c]"
          >
            Back to Paper Bloom Home
          </a>
        </div>
      </div>
    </>
  );
}
