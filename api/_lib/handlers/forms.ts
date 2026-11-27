import { contactFormSchema, newsletterSchema } from '../../../shared/schemas';
import { getServerEnv } from '../env';
import { HttpError, readJsonBody, sendOk, withApiHandler } from '../http';
import { enforceRateLimit } from '../rate-limit';
import { createServiceSupabase } from '../supabase';

export const contactHandler = withApiHandler(async (req, res) => {
  if ((req.method || 'GET').toUpperCase() !== 'POST') {
    throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Use POST for /api/contact.');
  }

  await enforceRateLimit(req, 'contact', 5, 300);
  const body = contactFormSchema.parse(await readJsonBody(req));

  // Honeypot trap — silently succeed for bots without storing
  if (body.website && body.website.trim().length > 0) {
    sendOk(res, { received: true, mode: 'filtered' }, 201);
    return;
  }

  const env = getServerEnv();
  if (!env.supabaseConfigured) {
    sendOk(
      res,
      {
        received: true,
        mode: 'demo',
        message: 'Demo preview: message validated (connect Supabase to persist messages).',
      },
      201,
    );
    return;
  }

  const service = createServiceSupabase();
  const { error } = await service.from('contact_messages').insert({
    name: body.name,
    email: body.email,
    phone: body.phone,
    subject: body.subject,
    message: body.message,
  });

  if (error) {
    throw new HttpError(500, 'CONTACT_SAVE_ERROR', 'Unable to save your message right now.');
  }

  sendOk(res, { received: true, mode: 'connected' }, 201);
});

export const newsletterHandler = withApiHandler(async (req, res) => {
  if ((req.method || 'GET').toUpperCase() !== 'POST') {
    throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Use POST for /api/newsletter.');
  }

  await enforceRateLimit(req, 'newsletter', 6, 300);
  const body = newsletterSchema.parse(await readJsonBody(req));

  if (body.website && body.website.trim().length > 0) {
    sendOk(res, { subscribed: true, mode: 'filtered' }, 201);
    return;
  }

  const env = getServerEnv();
  if (!env.supabaseConfigured) {
    sendOk(
      res,
      {
        subscribed: true,
        mode: 'demo',
        message: 'Demo preview: email validated (connect Supabase to save subscribers).',
      },
      201,
    );
    return;
  }

  const service = createServiceSupabase();
  const { error } = await service
    .from('newsletter_subscribers')
    .upsert({ email: body.email.toLowerCase() }, { onConflict: 'email', ignoreDuplicates: true });

  if (error) {
    throw new HttpError(500, 'NEWSLETTER_SAVE_ERROR', 'Unable to subscribe right now.');
  }

  sendOk(res, { subscribed: true, mode: 'connected' }, 201);
});
