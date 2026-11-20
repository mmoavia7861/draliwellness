import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { PageMeta } from '../components/PageMeta';
import { filterAndSortProducts, type SortOption } from '../utils/commerce';

export const ShopPage: React.FC = () => {
  const { products, visibleCategories } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ?? 'all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setSelectedCategory(searchParams.get('category') ?? 'all');
  }, [searchParams]);

  const filteredProducts = filterAndSortProducts(products, {
    query,
    categoryId: selectedCategory,
    sortBy,
  });

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const next = new URLSearchParams(searchParams);
    if (catId === 'all') {
      next.delete('category');
    } else {
      next.set('category', catId);
    }
    setSearchParams(next);
  };

  return (
    <>
      <PageMeta
        title="Shop BrainAxis Supplements — Dr. Ali Hassan Health & Wellness"
        description="Browse verified BrainAxis wellness supplements including Energy Boost multivitamins and SUNDEX-D Vitamin D3 200,000 IU."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="space-y-2 border-b border-[#174D40]/12 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
            BrainAxis Supplement Store
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">
            Shop Wellness Formulations
          </h1>
          <p className="text-sm text-[#252B29]/75 max-w-2xl">
            Verified nutritional products with complete composition details, usage directions, and nationwide Cash on Delivery across Pakistan.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Dynamic Categories (Only categories containing live products) */}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              className={`h-9 px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#174D40] text-white'
                  : 'bg-white border border-[#174D40]/15 text-[#252B29] hover:border-[#174D40]'
              }`}
            >
              All Products
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`h-9 px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#174D40] text-white'
                    : 'bg-white border border-[#174D40]/15 text-[#252B29] hover:border-[#174D40]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#252B29]/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <label htmlFor="shop-search" className="sr-only">
                Search products
              </label>
              <input
                id="shop-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search supplements..."
                className="h-10 pl-9 pr-3.5 rounded-lg border border-[#174D40]/20 bg-white text-sm text-[#252B29] w-full sm:w-64 focus:outline-none focus:border-[#174D40]"
              />
            </div>

            <label htmlFor="shop-sort" className="sr-only">
              Sort products
            </label>
            <select
              id="shop-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white text-sm text-[#252B29] focus:outline-none focus:border-[#174D40]"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#174D40]/12 rounded-2xl p-12 text-center space-y-3">
            <p className="font-serif text-2xl text-[#174D40]">No matching supplements found</p>
            <p className="text-sm text-[#252B29]/70">
              Try clearing your search keyword or switching category filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                handleCategoryChange('all');
              }}
              className="h-10 px-5 rounded-lg bg-[#174D40] text-white text-sm font-medium hover:bg-[#113A30] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-8 ${
              filteredProducts.length <= 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-5xl'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
