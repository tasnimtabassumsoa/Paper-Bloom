import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Lock, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { BD_DISTRICTS } from '@shared/constants';
import { formatBdt } from '@shared/format';
import { placeOrderSchema } from '@shared/schemas';
import { PageMeta } from '@/components/ui/PageMeta';
import { SITE_CONFIG } from '@/config/site';
import { useAuth } from '@/hooks/useAuth';
import { useAddresses, useCart, useShippingZones } from '@/hooks/useStore';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/apiClient';

type CheckoutFormValues = z.infer<typeof placeOrderSchema>;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { isAuthenticated, isDemoMode } = useAuth();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: zones = [] } = useShippingZones();
  const { data: addresses = [] } = useAddresses();

  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(placeOrderSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      zoneCode: cart?.zoneCode || 'dhaka_city',
      district: 'Dhaka',
      thana: '',
      addressLine: '',
      landmark: '',
      postalCode: '',
      paymentMethod: 'cod',
      couponCode: cart?.couponCode ?? null,
      giftWrap: cart?.giftWrap ?? false,
      giftMessage: '',
      customerNote: '',
      acceptedDemoTerms: true,
    },
  });

  const watchedZone = watch('zoneCode');
  const watchedGiftWrap = watch('giftWrap');
  const selectedZone = zones.find((z) => z.code === watchedZone);

  useEffect(() => {
    if (selectedZone?.isPickup) {
      setValue('paymentMethod', 'pickup');
    } else if (watch('paymentMethod') === 'pickup') {
      setValue('paymentMethod', 'cod');
    }
  }, [selectedZone?.isPickup, setValue, watch]);

  // Pre-fill default saved address when available
  useEffect(() => {
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (!def) return;
    setValue('customerName', def.recipientName);
    setValue('customerPhone', def.phone);
    setValue('zoneCode', def.zoneCode);
    setValue('district', def.district as CheckoutFormValues['district']);
    setValue('thana', def.thana);
    setValue('addressLine', def.addressLine);
    setValue('landmark', def.landmark);
    setValue('postalCode', def.postalCode);
  }, [addresses, setValue]);

  const { data: quote } = useQuery({
    queryKey: ['checkout-quote', watchedZone, watchedGiftWrap, cart?.couponCode, cart?.itemCount],
    queryFn: () =>
      apiClient.getCheckoutQuote({
        zoneCode: watchedZone,
        couponCode: cart?.couponCode ?? null,
        giftWrap: Boolean(watchedGiftWrap),
      }),
    enabled: (cart?.items.length ?? 0) > 0,
  });

  const pricing = quote?.pricing ?? cart?.pricing;

  const applySavedAddress = (addrId: string) => {
    const addr = addresses.find((a) => a.id === addrId);
    if (!addr) return;
    setValue('customerName', addr.recipientName);
    setValue('customerPhone', addr.phone);
    setValue('zoneCode', addr.zoneCode);
    setValue('district', addr.district as CheckoutFormValues['district']);
    setValue('thana', addr.thana);
    setValue('addressLine', addr.addressLine);
    setValue('landmark', addr.landmark);
    setValue('postalCode', addr.postalCode);
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    setSubmitting(true);
    try {
      const order = await apiClient.placeOrder(idempotencyKey, {
        ...values,
        acceptedDemoTerms: true,
        couponCode: cart?.couponCode ?? null,
      });
      await qc.invalidateQueries({ queryKey: ['cart'] });
      await qc.invalidateQueries({ queryKey: ['orders'] });
      setIdempotencyKey(crypto.randomUUID());
      navigate(`/order-confirmation/${encodeURIComponent(order.orderNumber)}`, {
        state: { order },
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to place demo order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="h-96 rounded-2xl bg-white border border-[#dec0b7] animate-pulse" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <h1 className="font-editorial text-3xl text-[#181d1a] mb-3">Your bag is empty</h1>
        <p className="text-sm text-[#525954] mb-6">
          Add stationery or books to your bag before checking out.
        </p>
        <Link
          to="/shop"
          className="inline-flex px-6 py-3 rounded-full bg-[#9f3c16] text-white text-sm font-medium"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Checkout"
        description="Complete your Paper Bloom demonstration order with Cash on Delivery across Bangladesh."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <ol className="flex items-center justify-center gap-3 sm:gap-6 text-xs font-medium mb-8">
          <li className="text-[#476553]">
            <Link to="/cart" className="hover:underline">1. Shopping Bag</Link>
          </li>
          <span className="text-[#dec0b7]" aria-hidden="true">/</span>
          <li className="text-[#9f3c16] font-semibold">2. Delivery &amp; Details</li>
          <span className="text-[#dec0b7]" aria-hidden="true">/</span>
          <li className="text-[#525954]">3. Confirmation</li>
        </ol>

        {/* Prominent Demo Store Disclosure */}
        <div
          role="note"
          className="mb-8 rounded-2xl bg-[#faf6f0] border border-[#9f3c16]/40 p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-[#9f3c16] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#181d1a]">
            <p className="font-semibold text-[#9f3c16]">Demonstration Checkout</p>
            <p className="text-[#525954] mt-0.5">{SITE_CONFIG.demoNotice}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            {!isDemoMode && !isAuthenticated && (
              <div className="rounded-2xl bg-white border border-[#dec0b7] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <p className="text-[#525954]">
                  Checking out as a guest (a temporary guest session starts automatically), or{' '}
                  <Link to="/login" className="text-[#9f3c16] font-semibold underline">
                    sign in
                  </Link>{' '}
                  to sync across devices.
                </p>
              </div>
            )}

            {addresses.length > 0 && (
              <div className="rounded-2xl bg-white border border-[#dec0b7] p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#476553] mb-3">
                  Saved Addresses
                </h2>
                <div className="flex flex-wrap gap-2">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => applySavedAddress(addr.id)}
                      className="px-3.5 py-2 rounded-xl border border-[#dec0b7] text-left text-xs hover:border-[#9f3c16] hover:bg-[#faf6f0]"
                    >
                      <span className="font-semibold block">{addr.label}</span>
                      <span className="text-[#525954]">{addr.thana}, {addr.district}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contact & Address */}
            <section className="rounded-2xl bg-white border border-[#dec0b7] p-6 space-y-4">
              <h2 className="font-editorial text-2xl text-[#181d1a]">1. Contact &amp; Delivery Address</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="chk-name" className="block text-xs font-semibold text-[#181d1a] mb-1">
                    Full Name *
                  </label>
                  <input
                    id="chk-name"
                    type="text"
                    {...register('customerName')}
                    placeholder="e.g. Tasnim Ahmed"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-xs text-[#9f3c16]">{errors.customerName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="chk-phone" className="block text-xs font-semibold text-[#181d1a] mb-1">
                    Bangladesh Mobile Number *
                  </label>
                  <input
                    id="chk-phone"
                    type="tel"
                    {...register('customerPhone')}
                    placeholder="01712345678"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm tabular-nums"
                  />
                  {errors.customerPhone && (
                    <p className="mt-1 text-xs text-[#9f3c16]">{errors.customerPhone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="chk-email" className="block text-xs font-semibold text-[#181d1a] mb-1">
                  Email (optional, for order summary)
                </label>
                <input
                  id="chk-email"
                  type="email"
                  {...register('customerEmail')}
                  placeholder="you@example.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                />
                {errors.customerEmail && (
                  <p className="mt-1 text-xs text-[#9f3c16]">{errors.customerEmail.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="chk-zone" className="block text-xs font-semibold text-[#181d1a] mb-1">
                  Delivery Zone *
                </label>
                <select
                  id="chk-zone"
                  {...register('zoneCode')}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                >
                  {zones.map((z) => (
                    <option key={z.code} value={z.code}>
                      {z.name} — {z.feeBdt === 0 ? 'Free' : formatBdt(z.feeBdt)} ({z.etaText})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="chk-district" className="block text-xs font-semibold text-[#181d1a] mb-1">
                    District *
                  </label>
                  <select
                    id="chk-district"
                    {...register('district')}
                    className="w-full h-11 px-3 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                  >
                    {BD_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="chk-thana" className="block text-xs font-semibold text-[#181d1a] mb-1">
                    Area / Thana *
                  </label>
                  <input
                    id="chk-thana"
                    type="text"
                    {...register('thana')}
                    placeholder="e.g. Dhanmondi / Mirpur 10"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                  />
                  {errors.thana && (
                    <p className="mt-1 text-xs text-[#9f3c16]">{errors.thana.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="chk-postal" className="block text-xs font-semibold text-[#181d1a] mb-1">
                    Postal Code
                  </label>
                  <input
                    id="chk-postal"
                    type="text"
                    {...register('postalCode')}
                    placeholder="e.g. 1209"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm tabular-nums"
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-xs text-[#9f3c16]">{errors.postalCode.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="chk-address" className="block text-xs font-semibold text-[#181d1a] mb-1">
                  Full Street / House / Flat Address *
                </label>
                <input
                  id="chk-address"
                  type="text"
                  {...register('addressLine')}
                  placeholder="House, Road, Block/Sector, Flat number (English or বাংলা)"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                />
                {errors.addressLine && (
                  <p className="mt-1 text-xs text-[#9f3c16]">{errors.addressLine.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="chk-landmark" className="block text-xs font-semibold text-[#181d1a] mb-1">
                  Nearby Landmark (optional)
                </label>
                <input
                  id="chk-landmark"
                  type="text"
                  {...register('landmark')}
                  placeholder="e.g. Near Rabindra Sarobar"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                />
              </div>
            </section>

            {/* Gift & Notes */}
            <section className="rounded-2xl bg-white border border-[#dec0b7] p-6 space-y-4">
              <h2 className="font-editorial text-2xl text-[#181d1a]">2. Gift Options &amp; Note</h2>

              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input type="checkbox" {...register('giftWrap')} className="accent-[#9f3c16]" />
                <span>
                  Add kraft paper gift wrap &amp; twine (+{formatBdt(SITE_CONFIG.pricing.giftWrapFeeBdt)})
                </span>
              </label>

              <div>
                <label htmlFor="chk-gift-msg" className="block text-xs font-semibold text-[#181d1a] mb-1">
                  Gift Card Message (optional, English or বাংলা)
                </label>
                <input
                  id="chk-gift-msg"
                  type="text"
                  {...register('giftMessage')}
                  placeholder="Write a warm note for the recipient..."
                  className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                />
              </div>

              <div>
                <label htmlFor="chk-note" className="block text-xs font-semibold text-[#181d1a] mb-1">
                  Delivery Instructions (optional)
                </label>
                <input
                  id="chk-note"
                  type="text"
                  {...register('customerNote')}
                  placeholder="e.g. Call before arrival / Leave with security"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                />
              </div>
            </section>

            {/* Payment Method */}
            <section className="rounded-2xl bg-white border border-[#dec0b7] p-6 space-y-4">
              <h2 className="font-editorial text-2xl text-[#181d1a]">3. Payment Method</h2>

              <div className="space-y-3">
                {!selectedZone?.isPickup && (
                  <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-[#9f3c16] bg-[#faf6f0] cursor-pointer">
                    <input
                      type="radio"
                      value="cod"
                      {...register('paymentMethod')}
                      className="mt-1 accent-[#9f3c16]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#181d1a]">
                        Cash on Delivery (Demo)
                      </p>
                      <p className="text-xs text-[#525954] mt-0.5">
                        Selected for demonstration orders. No real payment is collected online.
                      </p>
                    </div>
                  </label>
                )}

                {selectedZone?.isPickup && (
                  <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-[#9f3c16] bg-[#faf6f0] cursor-pointer">
                    <input
                      type="radio"
                      value="pickup"
                      {...register('paymentMethod')}
                      className="mt-1 accent-[#9f3c16]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#181d1a]">
                        Pay at Pickup (Demo)
                      </p>
                      <p className="text-xs text-[#525954] mt-0.5">
                        Collect at our Dhaka pickup point with ৳0 delivery fee.
                      </p>
                    </div>
                  </label>
                )}

                <div
                  aria-disabled="true"
                  className="flex items-center justify-between p-4 rounded-xl border border-[#eadcd6] bg-[#f6fbf5] opacity-60 cursor-not-allowed"
                >
                  <div>
                    <p className="text-sm font-medium text-[#525954]">
                      Digital Wallets &amp; Cards
                    </p>
                    <p className="text-xs text-[#525954]">
                      Online payment gateways are not active in this demo storefront.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white border border-[#dec0b7] text-[11px] font-medium text-[#525954] whitespace-nowrap">
                    Coming soon
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Right: Summary & Place Order */}
          <aside className="lg:col-span-5 bg-white rounded-2xl border border-[#dec0b7] p-6 space-y-5 lg:sticky lg:top-24">
            <h2 className="font-editorial text-2xl text-[#181d1a]">Order Summary</h2>

            <ul className="divide-y divide-[#eadcd6] max-h-72 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <li key={item.id} className="py-3 flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-[#181d1a] truncate">
                      {item.productName} <span className="text-[#525954]">× {item.quantity}</span>
                    </p>
                    <p className="text-xs text-[#525954]">{item.variantName}</p>
                    {item.personalization?.text && (
                      <p className="text-xs text-[#9f3c16]">
                        Custom: “{item.personalization.text}”
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-[#181d1a] tabular-nums shrink-0">
                    {formatBdt(item.lineTotalBdt)}
                  </span>
                </li>
              ))}
            </ul>

            {pricing && (
              <dl className="space-y-2 pt-3 border-t border-[#eadcd6] text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#525954]">Items subtotal</dt>
                  <dd className="tabular-nums">{formatBdt(pricing.itemsSubtotalBdt)}</dd>
                </div>
                {pricing.personalizationTotalBdt > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-[#525954]">Personalization fees</dt>
                    <dd className="tabular-nums">{formatBdt(pricing.personalizationTotalBdt)}</dd>
                  </div>
                )}
                {pricing.discountBdt > 0 && (
                  <div className="flex justify-between text-[#476553]">
                    <dt>Coupon ({cart.couponCode})</dt>
                    <dd className="tabular-nums font-semibold">-{formatBdt(pricing.discountBdt)}</dd>
                  </div>
                )}
                {pricing.giftWrapFeeBdt > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-[#525954]">Gift wrap</dt>
                    <dd className="tabular-nums">{formatBdt(pricing.giftWrapFeeBdt)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-[#525954] inline-flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    Delivery ({selectedZone?.name.split('(')[0]?.trim()})
                  </dt>
                  <dd className="tabular-nums">
                    {pricing.shippingFeeBdt === 0 ? 'Free' : formatBdt(pricing.shippingFeeBdt)}
                  </dd>
                </div>
                <div className="flex justify-between pt-3 border-t border-[#dec0b7] text-lg font-bold text-[#181d1a]">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatBdt(pricing.totalBdt)}</dd>
                </div>
              </dl>
            )}

            <label className="flex items-start gap-2.5 text-xs text-[#525954] cursor-pointer">
              <input
                type="checkbox"
                {...register('acceptedDemoTerms')}
                className="mt-0.5 accent-[#9f3c16]"
              />
              <span>
                I understand this is a demonstration order: no payment is charged and no physical goods are shipped.
              </span>
            </label>
            {errors.acceptedDemoTerms && (
              <p className="text-xs text-[#9f3c16]">{errors.acceptedDemoTerms.message}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-full bg-[#9f3c16] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#bf542c] disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Creating demo order...' : 'Place Demo Order'}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#525954]">
              <Lock className="w-3.5 h-3.5" />
              Totals are verified on the server before saving
            </p>
          </aside>
        </form>
      </div>
    </>
  );
}
