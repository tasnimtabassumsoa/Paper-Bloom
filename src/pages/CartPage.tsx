import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Gift,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatBdt } from '@shared/format';
import { SITE_CONFIG } from '@/config/site';
import {
  useApplyCoupon,
  useCart,
  useRemoveCartItem,
  useRemoveCoupon,
  useShippingZones,
  useToggleWishlist,
  useUpdateCartItem,
  useUpdateCartMeta,
} from '@/hooks/useStore';
import { apiClient } from '@/lib/apiClient';
import { PageMeta } from '@/components/ui/PageMeta';
import { ProductImage } from '@/components/ui/ProductImage';

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const { data: zones = [] } = useShippingZones();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const updateMeta = useUpdateCartMeta();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const toggleWishlist = useToggleWishlist();

  const [couponInput, setCouponInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPersText, setEditPersText] = useState('');

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="h-8 w-48 bg-[#eadcd6] rounded mb-6 animate-pulse" />
        <div className="h-64 bg-white rounded-2xl border border-[#dec0b7] animate-pulse" />
      </div>
    );
  }

  const items = cart?.items ?? [];
  const pricing = cart?.pricing;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    applyCoupon.mutate(couponInput.trim().toUpperCase(), {
      onSuccess: () => setCouponInput(''),
    });
  };

  const handleMoveToWishlist = async (productSlug: string, itemId: string) => {
    try {
      const { product } = await apiClient.getProductBySlug(productSlug);
      toggleWishlist.mutate({ product, isSaved: false });
      removeItem.mutate(itemId);
    } catch {
      // Ignore if product lookup fails
    }
  };

  return (
    <>
      <PageMeta
        title="Shopping Bag"
        description="Review your Paper Bloom stationery items, apply coupon codes, estimate Bangladesh delivery fees, and proceed to demo checkout."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* 3-Step Indicator */}
        <ol className="flex items-center justify-center gap-3 sm:gap-6 text-xs font-medium mb-8">
          <li className="text-[#9f3c16] font-semibold">1. Shopping Bag</li>
          <span className="text-[#dec0b7]" aria-hidden="true">/</span>
          <li className="text-[#525954]">2. Delivery &amp; Details</li>
          <span className="text-[#dec0b7]" aria-hidden="true">/</span>
          <li className="text-[#525954]">3. Confirmation</li>
        </ol>

        <h1 className="font-editorial text-3xl sm:text-4xl text-[#181d1a] mb-6">
          Your Shopping Bag
        </h1>

        {items.length === 0 ? (
          <div className="rounded-3xl bg-white border border-[#dec0b7] p-12 text-center max-w-2xl mx-auto">
            <ShoppingBag className="w-10 h-10 text-[#476553] mx-auto mb-3 opacity-75" />
            <h2 className="font-editorial text-2xl text-[#181d1a] mb-2">
              Your bag is quietly empty
            </h2>
            <p className="text-sm text-[#525954] mb-6">
              Explore everyday notebooks, custom English &amp; বাংলা journals, art supplies, or curated gift boxes.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#9f3c16] text-white text-sm font-medium hover:bg-[#bf542c]"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Lines */}
            <div className="lg:col-span-8 space-y-4">
              {cart?.warnings && cart.warnings.length > 0 && (
                <div className="rounded-2xl bg-[#fff5f2] border border-[#9f3c16]/40 p-4 text-xs text-[#7d2c0e] flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <ul className="space-y-1">
                    {cart.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-[#dec0b7] divide-y divide-[#eadcd6]">
                {items.map((item) => (
                  <div key={item.id} className="p-4 sm:p-5 flex gap-4">
                    <Link
                      to={`/product/${item.productSlug}`}
                      className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-[#faf6f0] border border-[#eadcd6] overflow-hidden shrink-0"
                    >
                      <ProductImage
                        src={item.imageUrl}
                        alt={item.imageAlt}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            to={`/product/${item.productSlug}`}
                            className="font-medium text-base text-[#181d1a] hover:text-[#9f3c16]"
                          >
                            {item.productName}
                          </Link>
                          <p className="text-xs text-[#525954] mt-0.5">
                            {item.variantName} · SKU {item.sku}
                          </p>
                        </div>
                        <p className="text-base font-semibold text-[#181d1a] tabular-nums shrink-0">
                          {formatBdt(item.lineTotalBdt)}
                        </p>
                      </div>

                      {/* Personalization summary & inline editor */}
                      {item.personalization?.text && (
                        <div className="mt-2.5 p-3 rounded-xl bg-[#faf6f0] border border-[#eadcd6] text-xs space-y-1">
                          {editingId === item.id ? (
                            <div className="flex flex-wrap gap-2 items-center">
                              <input
                                type="text"
                                maxLength={34}
                                value={editPersText}
                                onChange={(e) => setEditPersText(e.target.value)}
                                className="flex-1 min-w-[160px] h-9 px-3 rounded-lg border border-[#dec0b7] bg-white text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  updateItem.mutate({
                                    id: item.id,
                                    patch: {
                                      personalization: {
                                        ...item.personalization!,
                                        text: editPersText,
                                      },
                                    },
                                  });
                                  setEditingId(null);
                                }}
                                className="px-3 h-9 rounded-full bg-[#9f3c16] text-white font-medium"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3 h-9 rounded-full border border-[#dec0b7]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="font-semibold text-[#9f3c16]">
                                  Personalized:
                                </span>{' '}
                                <span className="font-medium text-[#181d1a]">
                                  “{item.personalization.text}”
                                </span>
                                {item.personalization.foilColor && (
                                  <span className="text-[#525954]">
                                    {' '}
                                    · {item.personalization.foilColor}
                                  </span>
                                )}
                                {item.personalization.fontStyle && (
                                  <span className="text-[#525954]">
                                    {' '}
                                    · {item.personalization.fontStyle}
                                  </span>
                                )}
                                {item.personalizationFeePerUnitBdt > 0 && (
                                  <span className="text-[#476553] ml-1 tabular-nums">
                                    (+{formatBdt(item.personalizationFeePerUnitBdt)}/ea)
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditPersText(item.personalization?.text ?? '');
                                }}
                                className="text-[#9f3c16] font-medium hover:underline shrink-0"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {item.warnings.length > 0 && (
                        <p className="mt-2 text-xs text-[#9f3c16] font-medium">
                          {item.warnings.map((w) => w.message).join(' ')}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center h-9 rounded-full border border-[#dec0b7] bg-[#f6fbf5] px-1">
                          <button
                            type="button"
                            disabled={item.quantity <= 1 || updateItem.isPending}
                            onClick={() =>
                              updateItem.mutate({
                                id: item.id,
                                patch: { quantity: item.quantity - 1 },
                              })
                            }
                            aria-label="Decrease quantity"
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white disabled:opacity-40"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={
                              item.quantity >= Math.min(20, item.stockQty) || updateItem.isPending
                            }
                            onClick={() =>
                              updateItem.mutate({
                                id: item.id,
                                patch: { quantity: item.quantity + 1 },
                              })
                            }
                            aria-label="Increase quantity"
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white disabled:opacity-40"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-[#525954]">
                          <button
                            type="button"
                            onClick={() => handleMoveToWishlist(item.productSlug, item.id)}
                            className="inline-flex items-center gap-1 hover:text-[#476553]"
                          >
                            <Heart className="w-3.5 h-3.5" />
                            Save for later
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem.mutate(item.id)}
                            className="inline-flex items-center gap-1 hover:text-[#9f3c16]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <Link to="/shop" className="text-sm font-medium text-[#476553] hover:underline">
                  &larr; Continue shopping
                </Link>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <aside className="lg:col-span-4 bg-white rounded-2xl border border-[#dec0b7] p-6 space-y-5 lg:sticky lg:top-24">
              <h2 className="font-editorial text-2xl text-[#181d1a]">Order Summary</h2>

              {/* Free Dhaka shipping progress */}
              {pricing && pricing.amountToFreeShippingBdt !== null && (
                <div className="p-3.5 rounded-xl bg-[#eef4ed] text-xs text-[#181d1a]">
                  {pricing.freeShippingApplied ? (
                    <span className="font-medium text-[#476553]">
                      Free Inside Dhaka delivery unlocked!
                    </span>
                  ) : (
                    <span>
                      Add{' '}
                      <strong className="tabular-nums">
                        {formatBdt(pricing.amountToFreeShippingBdt)}
                      </strong>{' '}
                      more for free Inside Dhaka City delivery.
                    </span>
                  )}
                </div>
              )}

              {/* Coupon */}
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label htmlFor="cart-coupon" className="block text-xs font-semibold text-[#525954]">
                  Coupon Code (try <span className="text-[#9f3c16]">BLOOM10</span> or{' '}
                  <span className="text-[#9f3c16]">WELCOME50</span>)
                </label>
                {cart?.couponCode ? (
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#eef4ed] border border-[#476553]/30 text-xs">
                    <div className="flex items-center gap-2 text-[#476553] font-semibold">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{cart.couponCode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCoupon.mutate()}
                      className="text-[#9f3c16] font-medium hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      id="cart-coupon"
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 h-10 px-3.5 rounded-full border border-[#dec0b7] bg-[#f6fbf5] text-sm uppercase"
                    />
                    <button
                      type="submit"
                      disabled={applyCoupon.isPending}
                      className="px-4 h-10 rounded-full border border-[#9f3c16] text-[#9f3c16] text-xs font-semibold hover:bg-[#9f3c16] hover:text-white transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </form>

              {/* Gift Wrap & Delivery Zone Estimator */}
              <div className="space-y-3 pt-2 border-t border-[#eadcd6]">
                <label className="flex items-start gap-2.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(cart?.giftWrap)}
                    onChange={(e) => updateMeta.mutate({ giftWrap: e.target.checked })}
                    className="mt-0.5 accent-[#9f3c16]"
                  />
                  <span>
                    <span className="font-semibold text-[#181d1a] inline-flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5 text-[#9f3c16]" />
                      Add kraft paper gift wrap &amp; twine (+{formatBdt(SITE_CONFIG.pricing.giftWrapFeeBdt)})
                    </span>
                  </span>
                </label>

                <div>
                  <label htmlFor="cart-zone" className="block text-xs font-semibold text-[#525954] mb-1">
                    Estimate Delivery Zone
                  </label>
                  <select
                    id="cart-zone"
                    value={cart?.zoneCode ?? 'dhaka_city'}
                    onChange={(e) => updateMeta.mutate({ zoneCode: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-xs"
                  >
                    {zones.map((z) => (
                      <option key={z.code} value={z.code}>
                        {z.name} — {z.feeBdt === 0 ? 'Free' : formatBdt(z.feeBdt)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Totals */}
              {pricing && (
                <dl className="space-y-2 pt-3 border-t border-[#eadcd6] text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[#525954]">Items subtotal</dt>
                    <dd className="tabular-nums font-medium">{formatBdt(pricing.itemsSubtotalBdt)}</dd>
                  </div>
                  {pricing.personalizationTotalBdt > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-[#525954]">Personalization</dt>
                      <dd className="tabular-nums font-medium">
                        {formatBdt(pricing.personalizationTotalBdt)}
                      </dd>
                    </div>
                  )}
                  {pricing.discountBdt > 0 && (
                    <div className="flex justify-between text-[#476553]">
                      <dt>Discount ({cart?.couponCode})</dt>
                      <dd className="tabular-nums font-semibold">
                        -{formatBdt(pricing.discountBdt)}
                      </dd>
                    </div>
                  )}
                  {pricing.giftWrapFeeBdt > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-[#525954]">Kraft gift wrap</dt>
                      <dd className="tabular-nums font-medium">{formatBdt(pricing.giftWrapFeeBdt)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-[#525954]">Estimated delivery</dt>
                    <dd className="tabular-nums font-medium">
                      {pricing.shippingFeeBdt === 0 ? 'Free' : formatBdt(pricing.shippingFeeBdt)}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-[#dec0b7] text-base font-bold text-[#181d1a]">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatBdt(pricing.totalBdt)}</dd>
                  </div>
                </dl>
              )}

              <Link
                to="/checkout"
                className="w-full h-12 rounded-full bg-[#9f3c16] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#bf542c] transition-colors"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-[11px] text-[#525954] leading-relaxed text-center">
                {SITE_CONFIG.demoNotice}
              </p>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
