import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { contactFormSchema } from '@shared/schemas';
import { PageMeta } from '@/components/ui/PageMeta';
import { SITE_CONFIG } from '@/config/site';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/apiClient';

type ContactValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { showToast } = useToast();
  const [submittedMsg, setSubmittedMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', phone: '', subject: '', message: '', website: '' },
  });

  const onSubmit = async (values: ContactValues) => {
    setSubmitting(true);
    try {
      const res = await apiClient.submitContact(values);
      setSubmittedMsg(res.message || 'Thank you! Your message has been recorded.');
      showToast('Message sent');
      reset();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to send message', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Contact Us"
        description="Contact Paper Bloom for bulk school orders, custom journal inquiries, or general support."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#476553] mb-1">
              Reach Out
            </p>
            <h1 className="font-editorial text-4xl text-[#181d1a]">Contact Paper Bloom</h1>
            <p className="text-sm text-[#525954] mt-2 leading-relaxed">
              Questions about bulk school kits, Bangla cover stamping, or delivery zones? Send us a message and we will respond as soon as possible.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-[#dec0b7] p-6 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#9f3c16] mt-1 shrink-0" />
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-[#525954]">{SITE_CONFIG.contact.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[#9f3c16] mt-1 shrink-0" />
              <div>
                <p className="font-semibold">Phone</p>
                <p className="text-[#525954] tabular-nums">{SITE_CONFIG.contact.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#9f3c16] mt-1 shrink-0" />
              <div>
                <p className="font-semibold">Collection Point</p>
                <p className="text-[#525954]">{SITE_CONFIG.contact.pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-[#9f3c16] mt-1 shrink-0" />
              <div>
                <p className="font-semibold">Hours</p>
                <p className="text-[#525954]">{SITE_CONFIG.contact.hours}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#dec0b7] p-6 sm:p-8">
          <h2 className="font-editorial text-2xl text-[#181d1a] mb-5">Send a Message</h2>

          {submittedMsg && (
            <div className="mb-5 rounded-2xl bg-[#eef4ed] border border-[#476553]/40 p-4 text-sm text-[#476553]">
              {submittedMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="c-name" className="block text-xs font-semibold mb-1">
                  Your Name *
                </label>
                <input
                  id="c-name"
                  type="text"
                  {...register('name')}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                />
                {errors.name && <p className="mt-1 text-xs text-[#9f3c16]">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="c-email" className="block text-xs font-semibold mb-1">
                  Email *
                </label>
                <input
                  id="c-email"
                  type="email"
                  {...register('email')}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                />
                {errors.email && <p className="mt-1 text-xs text-[#9f3c16]">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="c-phone" className="block text-xs font-semibold mb-1">
                  Mobile Number (optional)
                </label>
                <input
                  id="c-phone"
                  type="tel"
                  {...register('phone')}
                  placeholder="01712345678"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                />
                {errors.phone && <p className="mt-1 text-xs text-[#9f3c16]">{errors.phone.message}</p>}
              </div>
              <div>
                <label htmlFor="c-subject" className="block text-xs font-semibold mb-1">
                  Subject *
                </label>
                <input
                  id="c-subject"
                  type="text"
                  {...register('subject')}
                  placeholder="e.g. Custom journal bulk order"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
                />
                {errors.subject && (
                  <p className="mt-1 text-xs text-[#9f3c16]">{errors.subject.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="c-message" className="block text-xs font-semibold mb-1">
                Message *
              </label>
              <textarea
                id="c-message"
                rows={5}
                {...register('message')}
                className="w-full p-3.5 rounded-xl border border-[#dec0b7] bg-[#f6fbf5] text-sm"
              />
              {errors.message && (
                <p className="mt-1 text-xs text-[#9f3c16]">{errors.message.message}</p>
              )}
            </div>

            {/* Honeypot */}
            <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} className="hidden" />

            <button
              type="submit"
              disabled={submitting}
              className="px-7 h-11 rounded-full bg-[#9f3c16] text-white text-sm font-semibold hover:bg-[#bf542c] disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
