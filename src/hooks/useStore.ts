import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PersonalizationInput, ProductDTO, WishlistItemDTO } from '@shared/types';
import { apiClient } from '@/lib/apiClient';
import { useToast } from './useToast';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.getHealth(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
    staleTime: 5 * 60_000,
  });
}

export function useShippingZones() {
  return useQuery({
    queryKey: ['shipping-zones'],
    queryFn: () => apiClient.getShippingZones(),
    staleTime: 5 * 60_000,
  });
}

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.getCart(),
    staleTime: 10_000,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: {
      productId: string;
      variantId: string;
      quantity: number;
      personalization?: PersonalizationInput | null;
    }) => apiClient.addToCart(input),
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
      showToast('Added to your shopping bag');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Could not add item to bag', 'error');
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { quantity?: number; personalization?: PersonalizationInput | null };
    }) => apiClient.updateCartItem(id, patch),
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
    },
    onError: (err: Error) => {
      showToast(err.message || 'Could not update item', 'error');
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => apiClient.removeCartItem(id),
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
      showToast('Removed from bag', 'info');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Could not remove item', 'error');
    },
  });
}

export function useUpdateCartMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: { zoneCode?: string; giftWrap?: boolean }) =>
      apiClient.updateCartMeta(patch),
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
    },
  });
}

export function useApplyCoupon() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (code: string) => apiClient.applyCoupon(code),
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
      showToast(`Coupon ${cart.couponCode} applied`);
    },
    onError: (err: Error) => {
      showToast(err.message || 'Invalid coupon code', 'error');
    },
  });
}

export function useRemoveCoupon() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: () => apiClient.removeCoupon(),
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
      showToast('Coupon removed', 'info');
    },
  });
}

export function useWishlist() {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: () => apiClient.getWishlist(),
    staleTime: 15_000,
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({
      product,
      isSaved,
    }: {
      product: ProductDTO;
      isSaved: boolean;
    }) => {
      if (isSaved) {
        await apiClient.removeFromWishlist(product.id);
        return { product, saved: false };
      } else {
        await apiClient.addToWishlist(product.id);
        return { product, saved: true };
      }
    },
    onMutate: async ({ product, isSaved }) => {
      await qc.cancelQueries({ queryKey: ['wishlist'] });
      const prev = qc.getQueryData<WishlistItemDTO[]>(['wishlist']) ?? [];
      if (isSaved) {
        qc.setQueryData(
          ['wishlist'],
          prev.filter((w) => w.productId !== product.id),
        );
      } else {
        qc.setQueryData(['wishlist'], [
          {
            id: `optimistic-${product.id}`,
            productId: product.id,
            createdAt: new Date().toISOString(),
            product,
          },
          ...prev,
        ]);
      }
      return { prev };
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['wishlist'], ctx.prev);
      showToast(err.message || 'Could not update wishlist', 'error');
    },
    onSuccess: ({ saved }) => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      showToast(saved ? 'Saved to wishlist' : 'Removed from wishlist', 'info');
    },
  });
}

export function useMoveWishlistToCart() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (productId: string) => apiClient.moveWishlistToCart(productId),
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      showToast('Moved to your shopping bag');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Unable to move item to bag', 'error');
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => apiClient.getOrders(),
    staleTime: 15_000,
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => apiClient.getAddresses(),
    staleTime: 30_000,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.getProfile(),
    staleTime: 30_000,
  });
}
