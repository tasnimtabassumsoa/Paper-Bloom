import { ArrowRight, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatBdt } from '@shared/format';
import { PageMeta } from '@/components/ui/PageMeta';
import { ProductImage } from '@/components/ui/ProductImage';
import {
  useMoveWishlistToCart,
  useToggleWishlist,
  useWishlist,
} from '@/hooks/useStore';

export default function WishlistPage() {
  const { data: items = [], isLoading } = useWishlist();
  const toggleWishlist = useToggleWishlist();
  const moveToCart = useMoveWishlistToCart();

  return (
    <>
      <PageMeta
        title="Saved Wishlist"
        description="Your saved Paper Bloom stationery, custom journals, art supplies, and books."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-editorial text-3xl sm:text-4xl text-[#181d1a] mb-6">
          Saved Wishlist
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-white border border-[#eadcd6] animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl bg-white border border-[#dec0b7] p-12 text-center max-w-xl mx-auto">
            <Heart className="w-10 h-10 text-[#9f3c16] mx-auto mb-3 opacity-70" />
            <h2 className="font-editorial text-2xl text-[#181d1a] mb-2">
              No saved items yet
            </h2>
            <p className="text-sm text-[#525954] mb-6">
              Tap the heart icon on any notebook, art kit, or book to save it for later.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#9f3c16] text-white text-sm font-medium"
            >
              Explore Stationery
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map(({ id, product }) => (
              <div
                key={id}
                className="bg-white rounded-2xl border border-[#dec0b7] overflow-hidden flex flex-col"
              >
                <Link
                  to={`/product/${product.slug}`}
                  className="aspect-[4/5] bg-[#faf6f0] overflow-hidden block"
                >
                  <ProductImage
                    src={product.images[0]?.url ?? ''}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-[11px] uppercase tracking-wider text-[#476553] font-medium">
                    {product.categoryName}
                  </p>
                  <Link
                    to={`/product/${product.slug}`}
                    className="font-medium text-sm text-[#181d1a] hover:text-[#9f3c16] mt-1 line-clamp-2"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm font-bold text-[#181d1a] tabular-nums mt-2 mb-4">
                    {formatBdt(product.basePriceBdt)}
                  </p>

                  <div className="mt-auto flex gap-2">
                    {product.isCustomizable ? (
                      <Link
                        to={`/product/${product.slug}`}
                        className="flex-1 h-10 rounded-full bg-[#9f3c16] text-white text-xs font-medium flex items-center justify-center"
                      >
                        Personalize
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={!product.inStock || moveToCart.isPending}
                        onClick={() => moveToCart.mutate(product.id)}
                        className="flex-1 h-10 rounded-full bg-[#9f3c16] text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Move to Bag
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleWishlist.mutate({ product, isSaved: true })}
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="w-10 h-10 rounded-full border border-[#dec0b7] flex items-center justify-center text-[#525954] hover:text-[#9f3c16]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
