import { Heart, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatBdt, formatDiscountPercent } from '@shared/format';
import type { ProductDTO } from '@shared/types';
import { useAddToCart, useToggleWishlist, useWishlist } from '@/hooks/useStore';
import { ProductImage } from '../ui/ProductImage';

interface ProductCardProps {
  product: ProductDTO;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { data: wishlist = [] } = useWishlist();
  const toggleWishlist = useToggleWishlist();
  const addToCart = useAddToCart();

  const isSaved = wishlist.some((w) => w.productId === product.id);
  const discountPct = formatDiscountPercent(product.basePriceBdt, product.compareAtPriceBdt);
  const primaryImage = product.images[0];
  const defaultVariant = product.variants[0];

  const handleQuickAdd = () => {
    if (!defaultVariant || !product.inStock) return;
    addToCart.mutate({
      productId: product.id,
      variantId: defaultVariant.id,
      quantity: 1,
      personalization: null,
    });
  };

  return (
    <article className="group flex flex-col bg-white rounded-2xl border border-[#dec0b7]/65 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-12px_rgba(24,29,26,0.12)]">
      <div className="relative aspect-[4/5] bg-[#faf6f0] overflow-hidden">
        <Link
          to={`/product/${product.slug}`}
          className="block w-full h-full"
          aria-label={`View ${product.name}`}
        >
          <ProductImage
            src={primaryImage?.url ?? ''}
            alt={primaryImage?.altText ?? product.name}
            priority={priority}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        {product.badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 border border-[#dec0b7]/80 text-[11px] font-medium text-[#181d1a] tracking-wide">
            {product.badge}
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist.mutate({ product, isSaved })}
          aria-label={isSaved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={isSaved}
          className="absolute top-2 right-2 w-11 h-11 rounded-full bg-white/90 border border-[#dec0b7]/60 flex items-center justify-center text-[#181d1a] hover:bg-white transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isSaved ? 'fill-[#9f3c16] text-[#9f3c16]' : 'text-[#525954]'
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="flex-1 flex flex-col p-4">
        <p className="text-[11px] uppercase tracking-wider text-[#476553] font-medium mb-1 truncate">
          {product.categoryName}
        </p>

        <Link
          to={`/product/${product.slug}`}
          className="font-medium text-[15px] leading-snug text-[#181d1a] hover:text-[#9f3c16] transition-colors line-clamp-2 mb-1.5"
        >
          {product.name}
        </Link>

        <p className="text-xs text-[#525954] line-clamp-2 mb-3 flex-1">
          {product.shortDescription}
        </p>

        <div className="pt-2 border-t border-[#eadcd6]/70 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[15px] font-semibold text-[#181d1a] tabular-nums">
              {formatBdt(product.basePriceBdt)}
            </span>
            {product.compareAtPriceBdt && product.compareAtPriceBdt > product.basePriceBdt && (
              <span className="text-xs text-[#525954] line-through tabular-nums">
                {formatBdt(product.compareAtPriceBdt)}
              </span>
            )}
            {discountPct && (
              <span className="text-[11px] font-semibold text-[#9f3c16]">
                Save {discountPct}%
              </span>
            )}
          </div>

          {product.isCustomizable ? (
            <Link
              to={`/product/${product.slug}`}
              className="inline-flex items-center gap-1.5 px-3 min-h-[38px] rounded-full border border-[#9f3c16] text-[#9f3c16] text-xs font-medium hover:bg-[#9f3c16] hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Personalize
            </Link>
          ) : (
            <button
              type="button"
              disabled={!product.inStock || addToCart.isPending}
              onClick={handleQuickAdd}
              className="inline-flex items-center gap-1 px-3.5 min-h-[38px] rounded-full bg-[#9f3c16] text-white text-xs font-medium hover:bg-[#bf542c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              {product.inStock ? 'Add' : 'Sold out'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
