import { formatBdt } from '@shared/format';
import { PageMeta } from '@/components/ui/PageMeta';
import { SITE_CONFIG } from '@/config/site';
import { useShippingZones } from '@/hooks/useStore';

export default function ShippingReturnsPage() {
  const { data: zones = [] } = useShippingZones();

  return (
    <>
      <PageMeta
        title="Delivery Zones & Returns"
        description="Bangladesh delivery charges, free Dhaka shipping threshold, and Paper Bloom return rules."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#476553] mb-1">
            Bangladesh Delivery
          </p>
          <h1 className="font-editorial text-4xl text-[#181d1a]">
            Shipping Zones &amp; Return Policy
          </h1>
          <p className="mt-2 text-sm text-[#525954]">
            {SITE_CONFIG.demoNotice}
          </p>
        </div>

        <section className="bg-white rounded-3xl border border-[#dec0b7] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#eadcd6]">
            <h2 className="font-editorial text-2xl text-[#181d1a]">Delivery Zones &amp; Fees</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#faf6f0] text-xs uppercase tracking-wider text-[#525954]">
                <tr>
                  <th className="px-6 py-3">Zone</th>
                  <th className="px-6 py-3">Estimated Time</th>
                  <th className="px-6 py-3">Standard Fee</th>
                  <th className="px-6 py-3">Free Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadcd6]">
                {zones.map((z) => (
                  <tr key={z.code}>
                    <td className="px-6 py-4 font-medium text-[#181d1a]">{z.name}</td>
                    <td className="px-6 py-4 text-[#525954]">{z.etaText}</td>
                    <td className="px-6 py-4 font-semibold tabular-nums">
                      {z.feeBdt === 0 ? 'Free' : formatBdt(z.feeBdt)}
                    </td>
                    <td className="px-6 py-4 text-[#476553] tabular-nums">
                      {z.freeOverBdt ? `Free at ${formatBdt(z.freeOverBdt)}+` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-[#dec0b7] p-6 sm:p-8 space-y-4 text-sm text-[#525954] leading-relaxed">
          <h2 className="font-editorial text-2xl text-[#181d1a]">Returns &amp; Replacements</h2>
          <p>
            <strong className="text-[#181d1a]">Standard stationery &amp; books:</strong> Unused items in original unopened packaging may be exchanged or returned within 7 days of delivery.
          </p>
          <p>
            <strong className="text-[#181d1a]">Personalized items:</strong> Notebooks, diaries, bookmarks, and sticker sheets customized with your name or text are made to order and are non-returnable unless they arrive damaged or contain an engraving/printing error on our part.
          </p>
          <p>
            <strong className="text-[#181d1a]">Damaged parcels:</strong> Please report transit damage within 48 hours of delivery with a clear photo via our Contact page so a replacement can be arranged.
          </p>
        </section>
      </div>
    </>
  );
}
