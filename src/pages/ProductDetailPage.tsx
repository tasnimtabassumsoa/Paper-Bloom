import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  ZoomIn,
  X,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { formatBdt, formatDiscountPercent } from '@shared/format';
import { validatePersonalizationAgainstConfig } from '@shared/schemas';
import { PersonalizationPreview } from '@/components/product/PersonalizationPreview';
import { ProductCard } from '@/components/product/ProductCard';
import { PageMeta } from '@/components/ui/PageMeta';
import { ProductImage } from '@/components/ui/ProductImage';
import {
  useAddToCart,
  useShippingZones,
  useToggleWishlist,
  useWishlist,
} from '@/hooks/useStore';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/apiClient';

export default function ProductDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { showToast } = useToast();
  const { data: wishlist = [] } = useWishlist();
  const toggleWishlist = useToggleWishlist();
  const addToCart = useAddToCart();
  const { data: zones = [] } = useShippingZones();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => apiClient.getProductBySlug(slug),
    enabled: Boolean(slug),
  });

  const product = data?.product;
  const related = data?.related ?? [];

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  // Personalization state
  const [wantPersonalization, setWantPersonalization] = useState(true);
  const [persText, setPersText] = useState('');
  const [persFoil, setPersFoil] = useState('');
  const [persFont, setPersFont] = useState('');
  const [persNote, setPersNote] = useState('');
  const [persError, setPersError] = useState('');

  // Accordions
  const [openAccordion, setOpenAccordion] = useState<'delivery' | 'returns' | null>('delivery');

  useEffect(() => {
    if (!product) return;
    setSelectedImageIdx(0);
    setSelectedVariantId(product.variants[0]?.id ?? '');
    setQuantity(1);
    setPersError('');
    setPersText('');
    setPersNote('');
    if (product.personalizationConfig) {
      setPersFoil(product.personalizationConfig.foilColors[0] ?? '');
      setPersFont(product.personalizationConfig.fontStyles[0] ?? '');
      setWantPersonalization(product.productType === 'customizable');
    } else {
      setWantPersonalization(false);
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-6 aspect-[4/5] rounded-3xl bg-white border border-[#eadcd6] animate-pulse" />
        <div className="lg:col-span-6 space-y-4">
          <div className="h-8 w-2/3 bg-[#eadcd6] rounded animate-pulse" />
          <div className="h-6 w-1/3 bg-[#eadcd6] rounded animate-pulse" />
          <div className="h-40 bg-[#eadcd6]/60 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="font-editorial text-3xl text-[#181d1a] mb-3">Product not found</h1>
        <p className="text-sm text-[#525954] mb-6">
          This stationery item may have moved or is no longer available.
        </p>
        <Link
          to="/shop"
          className="inline-flex px-6 py-3 rounded-full bg-[#9f3c16] text-white text-sm font-medium"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  const unitPrice = activeVariant?.priceOverrideBdt ?? product.basePriceBdt;
  const discountPct = formatDiscountPercent(unitPrice, product.compareAtPriceBdt);
  const isSaved = wishlist.some((w) => w.productId === product.id);
  const config = product.personalizationConfig;

  const applyingPers =
    Boolean(config?.enabled) && wantPersonalization && persText.trim().length > 0;
  const persFeePerUnit = applyingPers ? product.personalizationFeeBdt : 0;
  const totalUnitPrice = unitPrice + persFeePerUnit;

  const activeImage = product.images[selectedImageIdx] ?? product.images[0];
  const maxStock = activeVariant?.stockQty ?? 0;

  const handleAddToBag = () => {
    if (!activeVariant || maxStock <= 0) return;

    if (config?.enabled && wantPersonalization) {
      const check = validatePersonalizationAgainstConfig(
        { text: persText, foilColor: persFoil, fontStyle: persFont, note: persNote },
        config,
        product.productType === 'customizable',
      );
      if (!check.ok) {
        setPersError(check.message);
        showToast(check.message, 'error');
        return;
      }
      setPersError('');
      addToCart.mutate({
        productId: product.id,
        variantId: activeVariant.id,
        quantity,
        personalization: check.value,
      });
      return;
    }

    addToCart.mutate({
      productId: product.id,
      variantId: activeVariant.id,
      quantity,
      personalization: null,
    });
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    sku: activeVariant?.sku,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BDT',
      price: unitPrice,
      availability:
        maxStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <PageMeta
        title={product.name}
        description={product.shortDescription}
        jsonLd={jsonLd}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-28 lg:pb-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#525954] mb-6 flex-wrap">
          <Link to="/" className="hover:text-[#9f3c16]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <Link to="/shop" className="hover:text-[#9f3c16]">Shop</Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <Link to={`/shop/${product.categorySlug}`} className="hover:text-[#9f3c16]">
            {product.categoryName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-[#181d1a] font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Gallery */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
            <div className="relative aspect-[4/5] rounded-3xl bg-[#faf6f0] border border-[#dec0b7] overflow-hidden">
              <ProductImage
                src={activeImage?.url ?? ''}
                alt={activeImage?.altText ?? product.name}
                priority
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                aria-label="Enlarge product image"
                className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-white/90 border border-[#dec0b7] flex items-center justify-center text-[#181d1a] hover:bg-white shadow-sm"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    aria-label={`View photo ${idx + 1}`}
                    className={`w-20 h-24 rounded-xl overflow-hidden border-2 shrink-0 bg-[#faf6f0] ${
                      selectedImageIdx === idx ? 'border-[#9f3c16]' : 'border-[#dec0b7]/60'
                    }`}
                  >
                    <ProductImage
                      src={img.url}
                      alt={img.altText}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Purchase & Personalization Module */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#476553] mb-1.5">
                {product.parentCategoryName} · {product.categoryName}
              </p>
              <h1 className="font-editorial text-3xl sm:text-4xl text-[#181d1a] leading-tight">
                {product.name}
              </h1>

              <div className="mt-3 flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl font-bold text-[#181d1a] tabular-nums">
                  {formatBdt(totalUnitPrice)}
                </span>
                {product.compareAtPriceBdt && product.compareAtPriceBdt > unitPrice && (
                  <span className="text-base text-[#525954] line-through tabular-nums">
                    {formatBdt(product.compareAtPriceBdt)}
                  </span>
                )}
                {discountPct && (
                  <span className="text-xs font-semibold text-[#9f3c16]">
                    Save {discountPct}%
                  </span>
                )}
                <span
                  className={`text-xs font-medium ${
                    maxStock > 0 ? 'text-[#476553]' : 'text-[#9f3c16]'
                  }`}
                >
                  {maxStock > 5
                    ? 'In stock'
                    : maxStock > 0
                      ? `Only ${maxStock} left`
                      : 'Out of stock'}
                </span>
              </div>

              <p className="mt-4 text-sm sm:text-base text-[#525954] leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Variants */}
            {product.variants.length > 1 && (
              <div className="pt-4 border-t border-[#eadcd6]">
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#525954] mb-2.5">
                  Select Option ({activeVariant?.name})
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      disabled={v.stockQty <= 0}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-4 min-h-[42px] rounded-full text-xs font-medium border transition-colors ${
                        v.id === activeVariant?.id
                          ? 'bg-[#181d1a] text-white border-[#181d1a]'
                          : 'bg-white text-[#181d1a] border-[#dec0b7] hover:border-[#9f3c16]'
                      } disabled:opacity-40`}
                    >
                      {v.name}
                      {v.priceOverrideBdt && v.priceOverrideBdt !== product.basePriceBdt
                        ? ` (${formatBdt(v.priceOverrideBdt)})`
                        : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Personalization Studio Panel */}
            {config?.enabled && (
              <div className="rounded-2xl bg-[#faf6f0] border border-[#dec0b7] p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#9f3c16]" aria-hidden="true" />
                    <h2 className="font-semibold text-sm text-[#181d1a]">
                      Personalize This Item
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-[#9f3c16] tabular-nums">
                    {product.personalizationFeeBdt > 0
                      ? `+${formatBdt(product.personalizationFeeBdt)} per item`
                      : 'Complimentary'}
                  </span>
                </div>

                {product.productType !== 'customizable' && (
                  <label className="flex items-center gap-2 text-xs font-medium text-[#181d1a] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantPersonalization}
                      onChange={(e) => setWantPersonalization(e.target.checked)}
                      className="accent-[#9f3c16]"
                    />
                    <span>Add custom name personalization</span>
                  </label>
                )}

                {wantPersonalization && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                    <div className="sm:col-span-7 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <label htmlFor="pers-text" className="font-medium text-[#181d1a]">
                            {config.label}
                          </label>
                          <span className="text-[#525954] tabular-nums">
                            {Array.from(persText).length}/{config.maxChars}
                          </span>
                        </div>
                        <input
                          id="pers-text"
                          type="text"
                          maxLength={config.maxChars}
                          value={persText}
                          onChange={(e) => {
                            setPersText(e.target.value);
                            setPersError('');
                          }}
                          placeholder={config.placeholder}
                          className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-white text-sm text-[#181d1a]"
                        />
                        <p className="mt-1 text-[11px] text-[#476553]">
                          {config.supportsBangla
                            ? 'Supports English & বাংলা script · '
                            : 'English letters only · '}
                          {config.leadTimeText}
                        </p>
                        {persError && (
                          <p role="alert" className="mt-1 text-xs font-medium text-[#9f3c16]">
                            {persError}
                          </p>
                        )}
                      </div>

                      {config.foilColors.length > 0 && (
                        <div>
                          <label htmlFor="pers-foil" className="block text-xs font-medium text-[#181d1a] mb-1">
                            Foil / Ink Finish
                          </label>
                          <select
                            id="pers-foil"
                            value={persFoil}
                            onChange={(e) => setPersFoil(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-[#dec0b7] bg-white text-xs"
                          >
                            {config.foilColors.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {config.fontStyles.length > 0 && (
                        <div>
                          <label htmlFor="pers-font" className="block text-xs font-medium text-[#181d1a] mb-1">
                            Typography Style
                          </label>
                          <select
                            id="pers-font"
                            value={persFont}
                            onChange={(e) => setPersFont(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-[#dec0b7] bg-white text-xs"
                          >
                            {config.fontStyles.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {config.allowNote && (
                        <div>
                          <label htmlFor="pers-note" className="block text-xs font-medium text-[#181d1a] mb-1">
                            Optional placement note
                          </label>
                          <input
                            id="pers-note"
                            type="text"
                            maxLength={config.noteMaxChars}
                            value={persNote}
                            onChange={(e) => setPersNote(e.target.value)}
                            placeholder="e.g. Bottom-right corner or centered"
                            className="w-full h-10 px-3 rounded-xl border border-[#dec0b7] bg-white text-xs"
                          />
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-5">
                      <PersonalizationPreview
                        text={persText}
                        foilColor={persFoil}
                        fontStyle={persFont}
                        coverTone={
                          activeVariant?.name.toLowerCase().includes('sage')
                            ? 'sage'
                            : activeVariant?.name.toLowerCase().includes('sand')
                              ? 'sand'
                              : activeVariant?.name.toLowerCase().includes('charcoal')
                                ? 'ink'
                                : 'terracotta'
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity & Add to Bag */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center h-12 rounded-full border border-[#dec0b7] bg-white px-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#faf6f0]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.min(20, maxStock || 1), q + 1))}
                  aria-label="Increase quantity"
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#faf6f0]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={maxStock <= 0 || addToCart.isPending}
                onClick={handleAddToBag}
                className="flex-1 min-w-[200px] h-12 px-6 rounded-full bg-[#9f3c16] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#bf542c] disabled:opacity-50 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                {maxStock <= 0
                  ? 'Out of Stock'
                  : addToCart.isPending
                    ? 'Adding...'
                    : `Add to Bag · ${formatBdt(totalUnitPrice * quantity)}`}
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist.mutate({ product, isSaved })}
                aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                aria-pressed={isSaved}
                className="w-12 h-12 rounded-full border border-[#dec0b7] bg-white flex items-center justify-center hover:bg-[#faf6f0]"
              >
                <Heart
                  className={`w-5 h-5 ${isSaved ? 'fill-[#9f3c16] text-[#9f3c16]' : 'text-[#525954]'}`}
                />
              </button>
            </div>

            {/* Specifications */}
            {Object.keys(product.specs).length > 0 && (
              <div className="pt-4 border-t border-[#eadcd6]">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#476553] mb-3">
                  Materials &amp; Specifications
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 py-1.5 border-b border-[#eadcd6]/60">
                      <dt className="text-[#525954]">{k}</dt>
                      <dd className="font-medium text-[#181d1a] text-right">{v}</dd>
                    </div>
                  ))}
                  {activeVariant && (
                    <div className="flex justify-between gap-2 py-1.5 border-b border-[#eadcd6]/60">
                      <dt className="text-[#525954]">SKU</dt>
                      <dd className="font-medium text-[#181d1a] tabular-nums">{activeVariant.sku}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Delivery & Returns Accordions */}
            <div className="border-t border-[#dec0b7] divide-y divide-[#dec0b7]">
              <div>
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === 'delivery' ? null : 'delivery')}
                  aria-expanded={openAccordion === 'delivery'}
                  className="w-full py-4 flex items-center justify-between text-left text-sm font-semibold text-[#181d1a]"
                >
                  <span>Delivery Zones &amp; Fees</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${openAccordion === 'delivery' ? 'rotate-180' : ''}`}
                  />
                </button>
                {openAccordion === 'delivery' && (
                  <div className="pb-4 space-y-2 text-xs text-[#525954]">
                    {zones.map((z) => (
                      <div key={z.code} className="flex justify-between gap-3">
                        <span>{z.name} ({z.etaText})</span>
                        <span className="font-semibold text-[#181d1a] tabular-nums shrink-0">
                          {z.feeBdt === 0 ? 'Free' : formatBdt(z.feeBdt)}
                          {z.freeOverBdt ? ` (Free ≥ ${formatBdt(z.freeOverBdt)})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === 'returns' ? null : 'returns')}
                  aria-expanded={openAccordion === 'returns'}
                  className="w-full py-4 flex items-center justify-between text-left text-sm font-semibold text-[#181d1a]"
                >
                  <span>Return &amp; Personalization Policy</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${openAccordion === 'returns' ? 'rotate-180' : ''}`}
                  />
                </button>
                {openAccordion === 'returns' && (
                  <p className="pb-4 text-xs text-[#525954] leading-relaxed">
                    Unused standard stationery items may be returned within 7 days of delivery in original packaging. Personalized items are made specifically with your name or text and cannot be returned unless damaged in transit or engraved differently from your order.{' '}
                    <Link to="/shipping-returns" className="text-[#9f3c16] underline">
                      Read full policy
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-16 pt-12 border-t border-[#dec0b7]">
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#181d1a] mb-6">
              Pair It With
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile sticky purchase bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/95 backdrop-blur border-t border-[#dec0b7] px-4 py-2.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[#525954] truncate max-w-[160px]">{product.name}</p>
          <p className="text-base font-bold text-[#181d1a] tabular-nums">
            {formatBdt(totalUnitPrice * quantity)}
          </p>
        </div>
        <button
          type="button"
          disabled={maxStock <= 0 || addToCart.isPending}
          onClick={handleAddToBag}
          className="h-11 px-5 rounded-full bg-[#9f3c16] text-white text-xs font-semibold whitespace-nowrap disabled:opacity-50"
        >
          {maxStock <= 0 ? 'Sold Out' : 'Add to Bag'}
        </button>
      </div>

      {/* Lightbox Modal */}
      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product image zoom"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <div
            className="relative max-w-xl w-full bg-[#faf6f0] rounded-3xl overflow-hidden p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              aria-label="Close zoom view"
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow"
            >
              <X className="w-5 h-5" />
            </button>
            <ProductImage
              src={activeImage?.url ?? ''}
              alt={activeImage?.altText ?? product.name}
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
