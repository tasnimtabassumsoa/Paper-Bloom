import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { formatBdt } from '@shared/format';
import { ProductCard } from '@/components/product/ProductCard';
import { PageMeta } from '@/components/ui/PageMeta';
import { useCategories } from '@/hooks/useStore';
import { apiClient } from '@/lib/apiClient';

const QUICK_AUDIENCE_TAGS = [
  { tag: 'back-to-school', label: 'Back-to-school' },
  { tag: 'study', label: 'Study kits' },
  { tag: 'journaling', label: 'Journaling' },
  { tag: 'teacher', label: 'For teachers' },
  { tag: 'gift', label: 'Gifts' },
  { tag: 'kids', label: 'For kids' },
];

export default function ShopPage() {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const q = searchParams.get('q') ?? '';
  const type = searchParams.get('type') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const customizable = searchParams.get('customizable') ?? '';
  const inStock = searchParams.get('inStock') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const sort = searchParams.get('sort') ?? 'featured';
  const page = Number(searchParams.get('page') ?? '1') || 1;
  const effectiveCategory = categorySlug ?? searchParams.get('category') ?? '';

  const { data: categories = [] } = useCategories();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'products',
      { effectiveCategory, q, type, minPrice, maxPrice, customizable, inStock, tag, sort, page },
    ],
    queryFn: () =>
      apiClient.getProducts({
        category: effectiveCategory || undefined,
        q: q || undefined,
        type: type || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        customizable: customizable || undefined,
        inStock: inStock || undefined,
        tag: tag || undefined,
        sort,
        page,
        pageSize: 12,
      }),
    staleTime: 30_000,
  });

  const activeCategoryObj =
    categories.find((c) => c.slug === effectiveCategory) ??
    categories.flatMap((c) => c.children ?? []).find((c) => c.slug === effectiveCategory);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const activeChips: Array<{ key: string; label: string }> = [];
  if (q) activeChips.push({ key: 'q', label: `Search: "${q}"` });
  if (type) activeChips.push({ key: 'type', label: `Type: ${type}` });
  if (customizable === 'true') activeChips.push({ key: 'customizable', label: 'Personalizable only' });
  if (inStock === 'true') activeChips.push({ key: 'inStock', label: 'In stock only' });
  if (tag) activeChips.push({ key: 'tag', label: `Collection: ${tag}` });
  if (minPrice) activeChips.push({ key: 'minPrice', label: `Min ${formatBdt(Number(minPrice))}` });
  if (maxPrice) activeChips.push({ key: 'maxPrice', label: `Max ${formatBdt(Number(maxPrice))}` });

  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  const filterSidebarContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#476553] mb-3">
          Categories
        </h2>
        <ul className="space-y-1.5 text-sm">
          <li>
            <Link
              to="/shop"
              onClick={() => setMobileFiltersOpen(false)}
              className={`block px-3 py-1.5 rounded-lg ${
                !effectiveCategory
                  ? 'bg-[#9f3c16]/10 text-[#9f3c16] font-semibold'
                  : 'text-[#181d1a] hover:bg-[#eef4ed]'
              }`}
            >
              All Stationery &amp; Books
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                to={`/shop/${cat.slug}`}
                onClick={() => setMobileFiltersOpen(false)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${
                  effectiveCategory === cat.slug
                    ? 'bg-[#9f3c16]/10 text-[#9f3c16] font-semibold'
                    : 'text-[#181d1a] hover:bg-[#eef4ed]'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-xs text-[#525954] tabular-nums">{cat.productCount}</span>
              </Link>
              {cat.children && cat.children.length > 0 && (
                <ul className="ml-3 mt-1 space-y-1 border-l border-[#dec0b7] pl-2.5">
                  {cat.children.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        to={`/shop/${sub.slug}`}
                        onClick={() => setMobileFiltersOpen(false)}
                        className={`flex items-center justify-between px-2 py-1 rounded text-xs ${
                          effectiveCategory === sub.slug
                            ? 'text-[#9f3c16] font-semibold'
                            : 'text-[#525954] hover:text-[#181d1a]'
                        }`}
                      >
                        <span>{sub.name}</span>
                        <span className="tabular-nums">{sub.productCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-4 border-t border-[#dec0b7]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#476553] mb-3">
          Price Range (BDT)
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="filter-min-price" className="block text-[11px] text-[#525954] mb-1">
              Min ৳
            </label>
            <input
              id="filter-min-price"
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => updateParam('minPrice', e.target.value)}
              placeholder="0"
              className="w-full h-10 px-3 rounded-lg border border-[#dec0b7] bg-white text-sm tabular-nums"
            />
          </div>
          <div>
            <label htmlFor="filter-max-price" className="block text-[11px] text-[#525954] mb-1">
              Max ৳
            </label>
            <input
              id="filter-max-price"
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => updateParam('maxPrice', e.target.value)}
              placeholder="3000"
              className="w-full h-10 px-3 rounded-lg border border-[#dec0b7] bg-white text-sm tabular-nums"
            />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => updateParam('maxPrice', '500')}
            className="px-2.5 py-1 rounded-full border border-[#dec0b7] text-xs hover:bg-[#faf6f0]"
          >
            Under ৳500
          </button>
          <button
            type="button"
            onClick={() => updateParam('maxPrice', '1000')}
            className="px-2.5 py-1 rounded-full border border-[#dec0b7] text-xs hover:bg-[#faf6f0]"
          >
            Under ৳1,000
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-[#dec0b7]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#476553] mb-3">
          Product Type
        </h2>
        <div className="space-y-2 text-sm">
          {[
            { value: '', label: 'All Types' },
            { value: 'ready', label: 'Ready-to-ship' },
            { value: 'customizable', label: 'Customizable' },
            { value: 'bundle', label: 'Gift & Study Bundles' },
          ].map((opt) => (
            <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="productType"
                checked={type === opt.value}
                onChange={() => updateParam('type', opt.value)}
                className="accent-[#9f3c16]"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-[#dec0b7] space-y-2.5 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={customizable === 'true'}
            onChange={(e) => updateParam('customizable', e.target.checked ? 'true' : '')}
            className="accent-[#9f3c16]"
          />
          <span>Personalizable (English / বাংলা)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock === 'true'}
            onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')}
            className="accent-[#9f3c16]"
          />
          <span>In stock only</span>
        </label>
      </div>

      <div className="pt-4 border-t border-[#dec0b7]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#476553] mb-2.5">
          Curated For
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_AUDIENCE_TAGS.map((t) => (
            <button
              key={t.tag}
              type="button"
              onClick={() => updateParam('tag', tag === t.tag ? '' : t.tag)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                tag === t.tag
                  ? 'bg-[#9f3c16] text-white border-[#9f3c16]'
                  : 'bg-white border-[#dec0b7] text-[#181d1a] hover:bg-[#faf6f0]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const pageTitle = q
    ? `Search: "${q}"`
    : activeCategoryObj?.name ?? 'Shop All Stationery';

  return (
    <>
      <PageMeta
        title={pageTitle}
        description={
          activeCategoryObj?.description ??
          'Browse Paper Bloom stationery, personalized journals, art supplies, books, and gift bundles.'
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#525954] mb-4">
          <Link to="/" className="hover:text-[#9f3c16]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <Link to="/shop" className="hover:text-[#9f3c16]">Shop</Link>
          {activeCategoryObj && (
            <>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-[#181d1a] font-medium">{activeCategoryObj.name}</span>
            </>
          )}
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#dec0b7]">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#181d1a]">{pageTitle}</h1>
            {activeCategoryObj?.description && (
              <p className="mt-1.5 text-sm text-[#525954] max-w-2xl">
                {activeCategoryObj.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 h-11 rounded-full border border-[#dec0b7] bg-white text-sm font-medium"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>

            <label htmlFor="catalog-sort" className="sr-only">Sort products</label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="h-11 px-4 rounded-full border border-[#dec0b7] bg-white text-sm text-[#181d1a]"
            >
              <option value="featured">Sort: Featured</option>
              <option value="popular">Sort: Most Popular</option>
              <option value="newest">Sort: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Active filter chips & result count */}
        <div className="py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#525954] tabular-nums">
            Showing {data?.items.length ?? 0} of {total} items
          </p>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => updateParam(chip.key, '')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef4ed] border border-[#dec0b7] text-xs text-[#181d1a] hover:bg-[#e1ece0]"
                >
                  <span>{chip.label}</span>
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-medium text-[#9f3c16] hover:underline px-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-[#dec0b7]/70 p-5">
            {filterSidebarContent}
          </aside>

          {/* Catalog grid */}
          <div className="lg:col-span-9">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-96 rounded-2xl bg-white border border-[#eadcd6] animate-pulse"
                  />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-2xl bg-white border border-[#dec0b7] p-10 text-center">
                <p className="font-editorial text-xl text-[#181d1a] mb-2">
                  Could not load products
                </p>
                <p className="text-sm text-[#525954] mb-4">
                  Please check your connection and try again.
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="px-5 py-2.5 rounded-full bg-[#9f3c16] text-white text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            ) : (data?.items.length ?? 0) === 0 ? (
              <div className="rounded-2xl bg-white border border-[#dec0b7] p-10 text-center">
                <p className="font-editorial text-2xl text-[#181d1a] mb-2">
                  No matching stationery found
                </p>
                <p className="text-sm text-[#525954] mb-5">
                  Try widening your price range or clearing active filters.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 rounded-full bg-[#9f3c16] text-white text-sm font-medium"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {data?.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => updateParam('page', String(page - 1))}
                      className="px-4 h-10 rounded-full border border-[#dec0b7] bg-white text-sm disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-[#525954] px-3 tabular-nums">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => updateParam('page', String(page + 1))}
                      className="px-4 h-10 rounded-full border border-[#dec0b7] bg-white text-sm disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom-sheet filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/45"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 bg-[#f6fbf5] rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#dec0b7] mb-5">
              <h2 className="font-editorial text-xl text-[#181d1a]">Filter Products</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#eef4ed]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {filterSidebarContent}
            <div className="mt-6 pt-4 border-t border-[#dec0b7] flex gap-3">
              <button
                type="button"
                onClick={() => {
                  clearAllFilters();
                  setMobileFiltersOpen(false);
                }}
                className="flex-1 h-11 rounded-full border border-[#dec0b7] text-sm font-medium"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 h-11 rounded-full bg-[#9f3c16] text-white text-sm font-medium"
              >
                Show {total} items
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
