import { z } from 'zod';
import { addOrIncrementCartItem } from '../cart-service';
import { getProductBySlug } from '../catalog-data';
import { HttpError, sendOk, withApiHandler } from '../http';
import { createUserSupabase, requireAuth } from '../supabase';

export const wishlistHandler = withApiHandler(async (req, res) => {
  const user = await requireAuth(req);
  const method = (req.method || 'GET').toUpperCase();
  const pathname = (req.url || '/').split('?')[0] || '/';
  const userClient = createUserSupabase(user.accessToken);

  if (pathname === '/api/wishlist' && method === 'GET') {
    const { data, error } = await userClient
      .from('wishlist_items')
      .select('id, product_id, created_at, products!inner(slug)')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new HttpError(500, 'WISHLIST_READ_ERROR', 'Unable to load your wishlist.');
    }

    const items = await Promise.all(
      (data ?? []).map(async (row) => {
        const slug = (row.products as unknown as { slug: string }).slug;
        const found = await getProductBySlug(slug);
        if (!found) return null;
        return {
          id: row.id as string,
          productId: row.product_id as string,
          createdAt: row.created_at as string,
          product: found.product,
        };
      }),
    );

    sendOk(
      res,
      items.filter((i): i is NonNullable<typeof i> => i !== null),
    );
    return;
  }

  const moveMatch = pathname.match(/^\/api\/wishlist\/([^/]+)\/move-to-cart$/);
  if (moveMatch && moveMatch[1] && method === 'POST') {
    const productId = z.string().uuid().parse(moveMatch[1]);
    const { data: variant } = await userClient
      .from('product_variants')
      .select('id')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('stock_qty', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!variant) {
      throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'No active variant found for this item.');
    }

    const cart = await addOrIncrementCartItem({
      accessToken: user.accessToken,
      userId: user.userId,
      productId,
      variantId: variant.id as string,
      quantity: 1,
      personalization: null,
    });

    await userClient
      .from('wishlist_items')
      .delete()
      .eq('user_id', user.userId)
      .eq('product_id', productId);

    sendOk(res, { cart, movedProductId: productId });
    return;
  }

  const prodMatch = pathname.match(/^\/api\/wishlist\/([^/]+)$/);
  if (prodMatch && prodMatch[1]) {
    const productId = z.string().uuid().parse(prodMatch[1]);

    if (method === 'POST') {
      const { error } = await userClient
        .from('wishlist_items')
        .upsert({ user_id: user.userId, product_id: productId }, { onConflict: 'user_id,product_id' });
      if (error) {
        throw new HttpError(400, 'WISHLIST_ADD_ERROR', 'Unable to save item to wishlist.');
      }
      sendOk(res, { productId, saved: true }, 201);
      return;
    }

    if (method === 'DELETE') {
      const { error } = await userClient
        .from('wishlist_items')
        .delete()
        .eq('user_id', user.userId)
        .eq('product_id', productId);
      if (error) {
        throw new HttpError(500, 'WISHLIST_DELETE_ERROR', 'Unable to remove wishlist item.');
      }
      sendOk(res, { productId, saved: false });
      return;
    }
  }

  throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Unsupported wishlist operation.');
});
