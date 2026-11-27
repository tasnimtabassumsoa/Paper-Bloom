import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { SITE_CONFIG } from '@/config/site';

const FAQS = [
  {
    q: 'Is this a real live store that takes payments?',
    a: SITE_CONFIG.demoNotice,
  },
  {
    q: 'Can I personalize journals and school labels in Bangla (বাংলা)?',
    a: 'Yes! Most customizable journals, bookmarks, and school sticker sheets support both English and Bangla Unicode text. You can preview how your name looks before adding an item to your bag.',
  },
  {
    q: 'How long do personalized items take to prepare?',
    a: 'Personalized items typically require 1 to 2 extra business days for custom stamping or printing before dispatch.',
  },
  {
    q: 'What are the delivery charges across Bangladesh?',
    a: 'Inside Dhaka City is ৳60 (and free when your discounted merchandise subtotal is ৳1,500 or more). Dhaka Suburbs are ৳100, Chattogram & Sylhet City are ৳120, All Other Districts are ৳130, and Self-Pickup is ৳0.',
  },
  {
    q: 'What payment methods are shown in checkout?',
    a: 'Demonstration checkout supports Cash on Delivery (and Pay at Pickup when choosing Self-Pickup). Online mobile banking and card gateways are not active in this demo storefront.',
  },
  {
    q: 'Do I need an account to place a demonstration order?',
    a: 'No. You can shop and check out as a guest. If Supabase is connected, your guest session preserves your bag, wishlist, and orders in the database—and you can upgrade to a full account at any time.',
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      <PageMeta
        title="Frequently Asked Questions"
        description="Answers about Paper Bloom ordering, Bangla personalization, Bangladesh delivery fees, and demonstration checkout."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#476553] mb-1">
          Help Center
        </p>
        <h1 className="font-editorial text-4xl text-[#181d1a] mb-8">
          Frequently Asked Questions
        </h1>

        <div className="bg-white rounded-3xl border border-[#dec0b7] divide-y divide-[#eadcd6] overflow-hidden">
          {FAQS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left font-medium text-sm sm:text-base text-[#181d1a] hover:bg-[#faf6f0]"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-[#525954] transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-[#525954] leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
