import { z } from 'zod';
import { addressSchema, profileUpdateSchema } from '../../../shared/schemas';
import type { AddressDTO, ProfileDTO } from '../../../shared/types';
import { HttpError, readJsonBody, sendOk, withApiHandler } from '../http';
import { createUserSupabase, requireAuth } from '../supabase';

function mapAddressRow(r: Record<string, unknown>): AddressDTO {
  return {
    id: r.id as string,
    label: r.label as string,
    recipientName: r.recipient_name as string,
    phone: r.phone as string,
    zoneCode: r.zone_code as string,
    district: r.district as string,
    thana: r.thana as string,
    addressLine: r.address_line as string,
    landmark: (r.landmark as string) ?? '',
    postalCode: (r.postal_code as string) ?? '',
    isDefault: Boolean(r.is_default),
  };
}

export const meHandler = withApiHandler(async (req, res) => {
  const user = await requireAuth(req);
  const method = (req.method || 'GET').toUpperCase();
  const pathname = (req.url || '/').split('?')[0] || '/';
  const userClient = createUserSupabase(user.accessToken);

  if (pathname === '/api/me' && method === 'GET') {
    const { data, error } = await userClient
      .from('profiles')
      .select('id, full_name, phone, is_guest, created_at')
      .eq('id', user.userId)
      .maybeSingle();

    if (error) {
      throw new HttpError(500, 'PROFILE_READ_ERROR', 'Unable to load your profile.');
    }

    const profile: ProfileDTO = {
      id: user.userId,
      email: user.email,
      fullName: (data?.full_name as string) ?? '',
      phone: (data?.phone as string) ?? '',
      isGuest: user.isGuest,
      createdAt: (data?.created_at as string) ?? new Date().toISOString(),
    };
    sendOk(res, profile);
    return;
  }

  if (pathname === '/api/me' && method === 'PATCH') {
    const body = profileUpdateSchema.parse(await readJsonBody(req));
    const { data, error } = await userClient
      .from('profiles')
      .update({ full_name: body.fullName, phone: body.phone })
      .eq('id', user.userId)
      .select('id, full_name, phone, is_guest, created_at')
      .single();

    if (error || !data) {
      throw new HttpError(500, 'PROFILE_UPDATE_ERROR', 'Unable to update your profile.');
    }

    sendOk(res, {
      id: user.userId,
      email: user.email,
      fullName: data.full_name as string,
      phone: data.phone as string,
      isGuest: user.isGuest,
      createdAt: data.created_at as string,
    });
    return;
  }

  if (pathname === '/api/me/addresses' && method === 'GET') {
    const { data, error } = await userClient
      .from('addresses')
      .select('*')
      .eq('user_id', user.userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new HttpError(500, 'ADDRESS_READ_ERROR', 'Unable to load saved addresses.');
    }
    sendOk(res, (data ?? []).map((r) => mapAddressRow(r as Record<string, unknown>)));
    return;
  }

  if (pathname === '/api/me/addresses' && method === 'POST') {
    const body = addressSchema.parse(await readJsonBody(req));
    if (body.isDefault) {
      await userClient
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.userId);
    }

    const { data, error } = await userClient
      .from('addresses')
      .insert({
        user_id: user.userId,
        label: body.label,
        recipient_name: body.recipientName,
        phone: body.phone,
        zone_code: body.zoneCode,
        district: body.district,
        thana: body.thana,
        address_line: body.addressLine,
        landmark: body.landmark,
        postal_code: body.postalCode,
        is_default: body.isDefault,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new HttpError(500, 'ADDRESS_CREATE_ERROR', 'Unable to save address.');
    }
    sendOk(res, mapAddressRow(data as Record<string, unknown>), 201);
    return;
  }

  const addrMatch = pathname.match(/^\/api\/me\/addresses\/([^/]+)$/);
  if (addrMatch && addrMatch[1]) {
    const addrId = z.string().uuid().parse(addrMatch[1]);

    if (method === 'PATCH') {
      const body = addressSchema.partial().parse(await readJsonBody(req));
      if (body.isDefault) {
        await userClient
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.userId);
      }

      const updates: Record<string, unknown> = {};
      if (body.label !== undefined) updates.label = body.label;
      if (body.recipientName !== undefined) updates.recipient_name = body.recipientName;
      if (body.phone !== undefined) updates.phone = body.phone;
      if (body.zoneCode !== undefined) updates.zone_code = body.zoneCode;
      if (body.district !== undefined) updates.district = body.district;
      if (body.thana !== undefined) updates.thana = body.thana;
      if (body.addressLine !== undefined) updates.address_line = body.addressLine;
      if (body.landmark !== undefined) updates.landmark = body.landmark;
      if (body.postalCode !== undefined) updates.postal_code = body.postalCode;
      if (body.isDefault !== undefined) updates.is_default = body.isDefault;

      const { data, error } = await userClient
        .from('addresses')
        .update(updates)
        .eq('id', addrId)
        .eq('user_id', user.userId)
        .select('*')
        .maybeSingle();

      if (error) {
        throw new HttpError(500, 'ADDRESS_UPDATE_ERROR', 'Unable to update address.');
      }
      if (!data) {
        throw new HttpError(404, 'ADDRESS_NOT_FOUND', 'Address not found.');
      }
      sendOk(res, mapAddressRow(data as Record<string, unknown>));
      return;
    }

    if (method === 'DELETE') {
      const { error } = await userClient
        .from('addresses')
        .delete()
        .eq('id', addrId)
        .eq('user_id', user.userId);
      if (error) {
        throw new HttpError(500, 'ADDRESS_DELETE_ERROR', 'Unable to delete address.');
      }
      sendOk(res, { id: addrId, deleted: true });
      return;
    }
  }

  throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Unsupported account operation.');
});
