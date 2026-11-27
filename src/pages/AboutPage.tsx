import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { ProductImage } from '@/components/ui/ProductImage';
import { SITE_CONFIG } from '@/config/site';

export default function AboutPage() {
  return (
    <>
      <PageMeta
        title="About Paper Bloom"
        description="Learn about Paper Bloom, an online stationery and creative-supplies store in Dhaka, Bangladesh."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#476553]">
              Our Story · {SITE_CONFIG.city}
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl text-[#181d1a] leading-tight">
              Stationery curated for calm study, creative work, and meaningful gifts.
            </h1>
            <p className="text-base text-[#525954] leading-relaxed">
              Paper Bloom brings together dependable everyday school stationery, personalized keepsake journals supporting both English and বাংলা script, artist-grade papers and paints, children&apos;s storybooks, and ready-to-gift study bundles in one welcoming online store.
            </p>
            <p className="text-sm text-[#525954] leading-relaxed">
              Whether you are preparing a student for a new term, choosing a thoughtful gift for a teacher, or setting up a weekend painting corner at home, every product listing is designed to show clear materials, transparent pricing in BDT, and honest delivery estimates across Bangladesh.
            </p>
          </div>
          <div className="md:col-span-5">
            <div className="rounded-3xl overflow-hidden border border-[#dec0b7] bg-[#faf6f0]">
              <ProductImage
                src="/images/custom-journal.svg"
                alt="Paper Bloom customized terracotta journal illustration"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#dec0b7] space-y-2">
            <h2 className="font-editorial text-xl text-[#181d1a]">Six Complete Families</h2>
            <p className="text-sm text-[#525954]">
              Everyday notebooks &amp; pens, Custom Studio keepsakes, Aesthetic desk supplies, Art Supplies, Books &amp; Learning, and Gift Bundles.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#dec0b7] space-y-2">
            <h2 className="font-editorial text-xl text-[#181d1a]">English &amp; বাংলা Ready</h2>
            <p className="text-sm text-[#525954]">
              Our personalization fields and cover previews accept both English and Bengali script so names and gifts feel truly personal.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#dec0b7] space-y-2">
            <h2 className="font-editorial text-xl text-[#181d1a]">Demo Storefront Notice</h2>
            <p className="text-sm text-[#525954]">
              {SITE_CONFIG.demoNotice}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/shop"
            className="px-6 py-3 rounded-full bg-[#9f3c16] text-white text-sm font-medium hover:bg-[#bf542c]"
          >
            Browse the Catalog
          </Link>
          <Link
            to="/contact"
            className="px-6 py-3 rounded-full border border-[#dec0b7] text-sm font-medium hover:bg-[#faf6f0]"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </>
  );
}
