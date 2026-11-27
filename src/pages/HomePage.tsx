import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  Gift,
  Palette,
  PenTool,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatBdt } from '@shared/format';
import { PersonalizationPreview } from '@/components/product/PersonalizationPreview';
import { ProductCard } from '@/components/product/ProductCard';
import { PageMeta } from '@/components/ui/PageMeta';
import { ProductImage } from '@/components/ui/ProductImage';
import { SITE_CONFIG } from '@/config/site';
import { apiClient } from '@/lib/apiClient';

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured'],
    queryFn: () => apiClient.getFeatured(),
    staleTime: 60_000,
  });

  const [showcaseTab, setShowcaseTab] = useState<'all' | 'personalized'>('all');
  const [previewName, setPreviewName] = useState('Tasnim · তাসনিম');
  const [previewFoil, setPreviewFoil] = useState('Warm Gold');
  const [previewFont, setPreviewFont] = useState('Classic Serif');
  const [previewCover, setPreviewCover] = useState<'terracotta' | 'sage' | 'sand' | 'ink'>('terracotta');

  const topCategories = data?.categories ?? [];
  const displayedFeatured =
    showcaseTab === 'personalized'
      ? data?.personalized ?? []
      : data?.bestsellers ?? [];

  return (
    <>
      <PageMeta
        title="Paper Bloom — Stationery & Creative Supplies in Dhaka, Bangladesh"
        description="Shop everyday stationery, personalized Bangla & English foil journals, aesthetic desk supplies, art materials, storybooks, and gift bundles across Bangladesh."
      />

      {/* 1. Editorial Hero */}
      <section className="bg-[#faf6f0] border-b border-[#dec0b7]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#476553]">
              Dhaka Online Stationery Studio
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[54px] leading-[1.1] text-[#181d1a]">
              Thoughtful paper for{' '}
              <span className="italic text-[#9f3c16]">quiet focus</span> and everyday craft.
            </h1>
            <p className="text-base sm:text-lg text-[#525954] max-w-xl leading-relaxed">
              From crisp classroom notebooks and artist gouache to custom foil-stamped keepsake journals in English and বাংলা—packed carefully for students, creators, and book lovers across Bangladesh.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 min-h-[46px] rounded-full bg-[#9f3c16] text-white text-sm font-medium hover:bg-[#bf542c] transition-colors whitespace-nowrap"
              >
                Shop All Stationery
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/shop/custom-studio"
                className="inline-flex items-center gap-2 px-6 min-h-[46px] rounded-full border border-[#9f3c16] text-[#9f3c16] text-sm font-medium hover:bg-[#9f3c16]/5 transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                Personalize a Journal
              </Link>
            </div>

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#525954]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#476553] shrink-0" aria-hidden="true" />
                <span>Free Dhaka delivery ≥ {formatBdt(SITE_CONFIG.pricing.freeDhakaOverBdt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#476553] shrink-0" aria-hidden="true" />
                <span>Cash on Delivery (64 districts)</span>
              </div>
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#476553] shrink-0" aria-hidden="true" />
                <span>English &amp; বাংলা personalization</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden border border-[#dec0b7] shadow-[0_24px_50px_-24px_rgba(24,29,26,0.18)] bg-white">
              <ProductImage
                src="/images/hero-flatlay.svg"
                alt="Paper Bloom stationery flat-lay featuring a terracotta personalized journal, open botanical sketchbook, sage washi tape, and brass roller pen"
                priority
                width={960}
                height={720}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Curated Categories Grid (all 6 families) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#476553] mb-1">
              Six Curated Families
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#181d1a]">
              Browse by Collection
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-sm font-medium text-[#9f3c16] hover:underline inline-flex items-center gap-1"
          >
            View complete catalog
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {topCategories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop/${cat.slug}`}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#dec0b7]/70 hover:border-[#9f3c16] transition-all hover:shadow-md"
            >
              <div className="w-20 h-24 rounded-xl bg-[#faf6f0] overflow-hidden shrink-0 border border-[#eadcd6]">
                <ProductImage
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-editorial text-xl text-[#181d1a] group-hover:text-[#9f3c16] transition-colors truncate">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#525954] line-clamp-2 mt-1">
                  {cat.description}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-[#476553] font-medium">
                  {cat.minPriceBdt !== null && cat.minPriceBdt !== undefined && (
                    <span className="tabular-nums">From {formatBdt(cat.minPriceBdt)}</span>
                  )}
                  {cat.productCount !== undefined && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{cat.productCount} items</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured & Bestsellers with All / Personalized Toggle */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#476553] mb-1">
              Student &amp; Studio Favourites
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#181d1a]">
              Curated Essentials
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Filter featured items"
            className="inline-flex p-1 rounded-full bg-[#eef4ed] border border-[#dec0b7]/60 self-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={showcaseTab === 'all'}
              onClick={() => setShowcaseTab('all')}
              className={`px-4 min-h-[38px] rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                showcaseTab === 'all'
                  ? 'bg-white text-[#181d1a] shadow-sm'
                  : 'text-[#525954] hover:text-[#181d1a]'
              }`}
            >
              All Featured
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={showcaseTab === 'personalized'}
              onClick={() => setShowcaseTab('personalized')}
              className={`px-4 min-h-[38px] rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                showcaseTab === 'personalized'
                  ? 'bg-white text-[#9f3c16] shadow-sm'
                  : 'text-[#525954] hover:text-[#181d1a]'
              }`}
            >
              Personalized Only
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-white border border-[#eadcd6] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedFeatured.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. How Personalization Works + Live Name Preview Widget */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl bg-[#faf6f0] border border-[#dec0b7] p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9f3c16] mb-1">
                Custom Studio Preview
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#181d1a]">
                Personalize in English or <span className="italic">বাংলা</span>
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#525954] max-w-xl">
                Preview your name, initials, or a favourite Bangla word right on our linen-grain journal cover before visiting a product page.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-4 rounded-2xl bg-white border border-[#eadcd6]">
                <p className="text-xs font-semibold text-[#9f3c16] mb-1">01. Choose an item</p>
                <p className="text-xs text-[#525954]">
                  Pick a keepsake journal, academic diary, wooden bookmark, or school sticker pack.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#eadcd6]">
                <p className="text-xs font-semibold text-[#9f3c16] mb-1">02. Type &amp; style</p>
                <p className="text-xs text-[#525954]">
                  Enter English or বাংলা text, select foil finish, and choose classic serif or script.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#eadcd6]">
                <p className="text-xs font-semibold text-[#9f3c16] mb-1">03. Prepared to order</p>
                <p className="text-xs text-[#525954]">
                  Custom pieces take 1–2 extra business days before dispatch across Bangladesh.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#dec0b7] p-5 space-y-4">
              <div>
                <label
                  htmlFor="home-preview-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#525954] mb-1.5"
                >
                  Try Your Cover Text
                </label>
                <input
                  id="home-preview-name"
                  type="text"
                  maxLength={24}
                  value={previewName}
                  onChange={(e) => setPreviewName(e.target.value)}
                  placeholder="Type English or বাংলা text..."
                  className="w-full h-11 px-4 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm text-[#181d1a]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="block text-xs font-medium text-[#525954] mb-1">Cover Shade</span>
                  <div className="flex gap-2">
                    {(['terracotta', 'sage', 'sand', 'ink'] as const).map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setPreviewCover(tone)}
                        aria-label={`Preview ${tone} cover`}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          tone === 'terracotta'
                            ? 'bg-[#9f3c16]'
                            : tone === 'sage'
                              ? 'bg-[#476553]'
                              : tone === 'sand'
                                ? 'bg-[#d8c4b6]'
                                : 'bg-[#222825]'
                        } ${previewCover === tone ? 'border-[#181d1a] scale-110' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="home-preview-foil" className="block text-xs font-medium text-[#525954] mb-1">
                    Foil Finish
                  </label>
                  <select
                    id="home-preview-foil"
                    value={previewFoil}
                    onChange={(e) => setPreviewFoil(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-xs"
                  >
                    <option value="Warm Gold">Warm Gold</option>
                    <option value="Rose Copper">Rose Copper</option>
                    <option value="Matte Ink">Matte Ink</option>
                    <option value="Blind Deboss">Blind Deboss</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="home-preview-font" className="block text-xs font-medium text-[#525954] mb-1">
                    Lettering Style
                  </label>
                  <select
                    id="home-preview-font"
                    value={previewFont}
                    onChange={(e) => setPreviewFont(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-xs"
                  >
                    <option value="Classic Serif">Classic Serif</option>
                    <option value="Editorial Script">Editorial Script</option>
                    <option value="Modern Sans">Modern Sans</option>
                  </select>
                </div>
              </div>

              <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                <Link
                  to="/product/personalized-vegan-leather-journal"
                  className="inline-flex items-center gap-2 px-5 min-h-[42px] rounded-full bg-[#9f3c16] text-white text-xs font-medium hover:bg-[#bf542c] transition-colors"
                >
                  Customize This Journal
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
                <Link
                  to="/shop/custom-studio"
                  className="text-xs font-medium text-[#476553] hover:underline"
                >
                  Browse all {data?.personalized.length ? 'customizable items' : 'Custom Studio'}
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <PersonalizationPreview
              text={previewName}
              foilColor={previewFoil}
              fontStyle={previewFont}
              coverTone={previewCover}
            />
          </div>
        </div>
      </section>

      {/* 5. Gift Collections Banner + Why Shop With Paper Bloom */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="rounded-3xl bg-[#476553] text-white p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7e8d1]">
              Gift Boxes &amp; Study Bundles
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl text-white">
              Ready-to-gift kits for students, teachers, and journal lovers
            </h2>
            <p className="text-sm sm:text-base text-[#e3efe7] max-w-2xl">
              Explore curated back-to-school study kits, teacher appreciation desk sets, and weekend watercolour boxes—available with kraft gift wrapping and a handwritten note card.
            </p>
          </div>
          <div className="lg:col-span-4 flex lg:justify-end gap-3 flex-wrap">
            <Link
              to="/shop/gift-bundles"
              className="inline-flex items-center gap-2 px-6 min-h-[46px] rounded-full bg-white text-[#181d1a] text-sm font-semibold hover:bg-[#faf6f0] transition-colors whitespace-nowrap"
            >
              <Gift className="w-4 h-4 text-[#9f3c16]" aria-hidden="true" />
              Shop Gift Bundles
            </Link>
            <Link
              to="/shop?maxPrice=1000"
              className="inline-flex items-center gap-2 px-5 min-h-[46px] rounded-full border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Gifts under ৳1,000
            </Link>
          </div>
        </div>

        {/* Truthful "Why Paper Bloom" strip */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Truck,
              title: '64-District Delivery',
              body: `Flat ${formatBdt(60)} inside Dhaka City (free at ${formatBdt(1500)}+) and courier coverage nationwide.`,
            },
            {
              icon: ShieldCheck,
              title: 'Cash on Delivery',
              body: 'Pay in cash when your parcel arrives, or choose Self-Pickup at zero delivery charge.',
            },
            {
              icon: Palette,
              title: 'English & বাংলা Foil',
              body: 'Custom cover stamping and school name stickers accept both Latin and Bengali scripts.',
            },
            {
              icon: BookOpen,
              title: 'All-Ages Curation',
              body: 'From early-reader Bangla storybooks and flashcards to 300gsm cold-press sketchbooks.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-5 rounded-2xl bg-white border border-[#dec0b7]/65 space-y-2"
            >
              <item.icon className="w-5 h-5 text-[#9f3c16]" aria-hidden="true" />
              <h3 className="font-semibold text-sm text-[#181d1a]">{item.title}</h3>
              <p className="text-xs text-[#525954] leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. New Arrivals */}
      {data?.newArrivals && data.newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-4">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#476553] mb-1">
                Recently Added
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl text-[#181d1a]">
                New Arrivals
              </h2>
            </div>
            <Link
              to="/shop?sort=newest"
              className="text-sm font-medium text-[#9f3c16] hover:underline inline-flex items-center gap-1"
            >
              Explore newest
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.newArrivals.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
