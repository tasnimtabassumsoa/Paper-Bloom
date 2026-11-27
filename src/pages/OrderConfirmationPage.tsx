import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Info, Package, ArrowRight } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { formatBdt, formatDateTimeDhaka } from '@shared/format';
import type { OrderDTO } from '@shared/types';
import { PageMeta } from '@/components/ui/PageMeta';
import { SITE_CONFIG } from '@/config/site';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';

export default function OrderConfirmationPage() {
  const { orderNumber = '' } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const stateOrder = (location.state as { order?: OrderDTO } | null)?.order;
  const { isDemoMode, isGuest } = useAuth();

  const { data: fetchedOrder, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => apiClient.getOrderByNumber(orderNumber),
    enabled: Boolean(orderNumber) && !stateOrder,
  });

  const order = stateOrder ?? fetchedOrder;

  if (isLoading && !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="h-64 rounded-3xl bg-white border border-[#dec0b7] animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <h1 className="font-editorial text-3xl text-[#181d1a] mb-3">Order not found</h1>
        <p className="text-sm text-[#525954] mb-6">
          We could not find order {orderNumber} under your current session.
        </p>
        <Link
          to="/shop"
          className="inline-flex px-6 py-3 rounded-full bg-[#9f3c16] text-white text-sm font-medium"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Order ${order.orderNumber} Confirmed`}
        description="Paper Bloom demonstration order summary."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
        <ol className="flex items-center justify-center gap-3 sm:gap-6 text-xs font-medium mb-4">
          <li className="text-[#476553]">1. Shopping Bag</li>
          <span className="text-[#dec0b7]" aria-hidden="true">/</span>
          <li className="text-[#476553]">2. Delivery &amp; Details</li>
          <span className="text-[#dec0b7]" aria-hidden="true">/</span>
          <li className="text-[#9f3c16] font-semibold">3. Confirmation</li>
        </ol>

        <div className="rounded-3xl bg-white border border-[#dec0b7] p-6 sm:p-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#c7e8d1] text-[#476553] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#476553]">
                Demonstration Order Recorded
              </p>
              <h1 className="font-editorial text-3xl text-[#181d1a] mt-0.5">
                Thank you, {order.customerName}
              </h1>
              <p className="text-sm text-[#525954] mt-1 tabular-nums">
                Order <strong className="text-[#181d1a]">{order.orderNumber}</strong> · Placed on{' '}
                {formatDateTimeDhaka(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Demo store summary notice */}
          <div className="rounded-2xl bg-[#faf6f0] border border-[#9f3c16]/40 p-4 text-xs sm:text-sm text-[#181d1a] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#9f3c16] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#9f3c16]">
                {isDemoMode ? 'Demo Preview (Browser Storage Only)' : 'Demo Order Notice'}
              </p>
              <p className="text-[#525954] mt-0.5">{SITE_CONFIG.demoNotice}</p>
            </div>
          </div>

          {/* Guest account upgrade callout */}
          {!isDemoMode && isGuest && (
            <div className="rounded-2xl bg-[#eef4ed] border border-[#476553]/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <p className="text-[#181d1a]">
                You placed this order as a guest. Create an account now to keep your order history across devices.
              </p>
              <Link
                to="/register"
                className="px-4 py-2 rounded-full bg-[#476553] text-white font-semibold whitespace-nowrap text-center"
              >
                Save My Account
              </Link>
            </div>
          )}

          {/* Delivery & Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[#eadcd6] text-sm">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#476553] mb-1.5">
                Delivery Details
              </h2>
              <p className="font-medium text-[#181d1a]">{order.customerName}</p>
              <p className="text-[#525954] tabular-nums">{order.customerPhone}</p>
              <p className="text-[#525954] mt-1">
                {order.shippingAddress.addressLine}, {order.shippingAddress.thana},{' '}
                {order.shippingAddress.district}
              </p>
              <p className="text-xs text-[#476553] mt-1">
                {order.shippingAddress.zoneName} · ETA: {order.etaText}
              </p>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#476553] mb-1.5">
                Payment &amp; Status
              </h2>
              <p className="text-[#181d1a]">
                Method:{' '}
                <strong className="font-medium">
                  {order.paymentMethod === 'pickup' ? 'Pay at Pickup (Demo)' : 'Cash on Delivery (Demo)'}
                </strong>
              </p>
              <p className="text-[#525954] capitalize">Status: {order.status}</p>
              {order.giftWrap && (
                <p className="text-xs text-[#476553] mt-1">
                  Includes kraft gift wrapping
                  {order.giftMessage ? ` — “${order.giftMessage}”` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="pt-4 border-t border-[#eadcd6]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#476553] mb-3">
              Items in This Order
            </h2>
            <ul className="divide-y divide-[#eadcd6]">
              {order.items.map((item) => (
                <li key={item.id} className="py-3 flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="font-medium text-[#181d1a]">
                      {item.name} × {item.quantity}
                    </p>
                    <p className="text-xs text-[#525954]">
                      {item.variantName} · SKU {item.sku}
                    </p>
                    {item.personalization?.text && (
                      <p className="text-xs text-[#9f3c16] mt-0.5">
                        Personalization: “{item.personalization.text}”
                        {item.personalization.foilColor ? ` (${item.personalization.foilColor})` : ''}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-[#181d1a] tabular-nums">
                    {formatBdt(item.lineTotalBdt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <dl className="space-y-1.5 pt-4 border-t border-[#eadcd6] text-sm">
            <div className="flex justify-between">
              <dt className="text-[#525954]">Items subtotal</dt>
              <dd className="tabular-nums">{formatBdt(order.subtotalBdt)}</dd>
            </div>
            {order.personalizationFeesBdt > 0 && (
              <div className="flex justify-between">
                <dt className="text-[#525954]">Personalization</dt>
                <dd className="tabular-nums">{formatBdt(order.personalizationFeesBdt)}</dd>
              </div>
            )}
            {order.discountBdt > 0 && (
              <div className="flex justify-between text-[#476553]">
                <dt>Discount ({order.couponCode})</dt>
                <dd className="tabular-nums">-{formatBdt(order.discountBdt)}</dd>
              </div>
            )}
            {order.giftWrapFeeBdt > 0 && (
              <div className="flex justify-between">
                <dt className="text-[#525954]">Gift wrap</dt>
                <dd className="tabular-nums">{formatBdt(order.giftWrapFeeBdt)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-[#525954]">Delivery fee</dt>
              <dd className="tabular-nums">
                {order.shippingFeeBdt === 0 ? 'Free' : formatBdt(order.shippingFeeBdt)}
              </dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#dec0b7] text-base font-bold text-[#181d1a]">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatBdt(order.totalBdt)}</dd>
            </div>
          </dl>

          <div className="pt-4 flex flex-wrap gap-3">
            <Link
              to="/account/orders"
              className="inline-flex items-center gap-2 px-5 h-11 rounded-full border border-[#dec0b7] text-sm font-medium hover:bg-[#faf6f0]"
            >
              <Package className="w-4 h-4 text-[#476553]" />
              Track in My Orders
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-[#9f3c16] text-white text-sm font-medium hover:bg-[#bf542c]"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
