import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import ProductCard from "../components/ProductCard";
import SEO from "../components/SEO";
import { API } from "../App";

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterNew, setFilterNew] = useState(searchParams.get("filter") === "new");
  const [filterSale, setFilterSale] = useState(searchParams.get("filter") === "sale");

  // Sync state with searchParams when URL changes (e.g. from footer links)
  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "");
    setSelectedBrand(searchParams.get("brand") || "");
    setFilterNew(searchParams.get("filter") === "new");
    setFilterSale(searchParams.get("filter") === "sale");
  }, [searchParams]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          axios.get(`${API}/categories`),
          axios.get(`${API}/brands`)
        ]);
        setCategories(catRes.data);
        setBrands(brandRes.data);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.set("category", selectedCategory);
        if (selectedBrand) params.set("brand", selectedBrand);
        if (filterNew) params.set("is_new_arrival", "true");
        if (filterSale) params.set("is_on_sale", "true");
        params.set("sort_by", sortBy);
        params.set("sort_order", sortOrder);
        params.set("limit", "20");

        const response = await axios.get(`${API}/products?${params.toString()}`);
        setProducts(response.data.products);
        setTotal(response.data.total);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, selectedBrand, sortBy, sortOrder, filterNew, filterSale, categories]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setFilterNew(false);
    setFilterSale(false);
    setSearchParams({});
  };

  const activeFiltersCount = [selectedCategory, selectedBrand, filterNew, filterSale].filter(Boolean).length;

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h4 className="text-xs uppercase tracking-[0.15em] text-stone-500 font-semibold mb-4">Category</h4>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.category_id}
              onClick={() => setSelectedCategory(selectedCategory === category.slug ? "" : category.slug)}
              className={`w-full text-left py-2.5 px-4 rounded-xl text-sm transition-all ${selectedCategory === category.slug
                ? "bg-pink-50 text-pink-700 font-medium"
                : "text-stone-600 hover:bg-stone-50"
                }`}
              data-testid={`filter-category-${category.slug}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="text-xs uppercase tracking-[0.15em] text-stone-500 font-semibold mb-4">Designer</h4>
        <div className="space-y-2">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(selectedBrand === brand ? "" : brand)}
              className={`w-full text-left py-2.5 px-4 rounded-xl text-sm transition-all ${selectedBrand === brand
                ? "bg-pink-50 text-pink-700 font-medium"
                : "text-stone-600 hover:bg-stone-50"
                }`}
              data-testid={`filter-brand-${brand.toLowerCase().replace(' ', '-')}`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Special Filters */}
      <div>
        <h4 className="text-xs uppercase tracking-[0.15em] text-stone-500 font-semibold mb-4">Filter By</h4>
        <div className="space-y-2">
          <button
            onClick={() => { setFilterNew(!filterNew); if (!filterNew) setFilterSale(false); }}
            className={`w-full text-left py-2.5 px-4 rounded-xl text-sm transition-all ${filterNew ? "bg-gold/10 text-gold-dark font-medium" : "text-stone-600 hover:bg-stone-50"
              }`}
            data-testid="filter-new-arrivals"
          >
            New Arrivals
          </button>
          <button
            onClick={() => { setFilterSale(!filterSale); if (!filterSale) setFilterNew(false); }}
            className={`w-full text-left py-2.5 px-4 rounded-xl text-sm transition-all ${filterSale ? "bg-pink-50 text-pink-700 font-medium" : "text-stone-600 hover:bg-stone-50"
              }`}
            data-testid="filter-on-sale"
          >
            On Sale
          </button>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full py-3 text-sm text-stone-500 hover:text-pink-600 transition-colors border-t border-stone-100 pt-6"
          data-testid="clear-filters-btn"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  const pageTitle = selectedCategory
    ? `${categories.find(c => c.slug === selectedCategory)?.name || "Shop"} Collection`
    : filterNew
      ? "New Arrivals"
      : filterSale
        ? "Sale Collection"
        : "Shop Luxury Ethnic Wear";

  const pageDescription = selectedCategory
    ? `Browse our ${categories.find(c => c.slug === selectedCategory)?.name?.toLowerCase()} collection featuring premium designer pieces.`
    : filterNew
      ? "Discover the latest arrivals in luxury ethnic wear. Shop new designer suits, lehengas, and traditional wear."
      : filterSale
        ? "Shop our sale collection and find amazing deals on luxury ethnic wear and designer suits."
        : "Explore our complete collection of luxury ethnic wear. Shop authentic designer suits, lehengas, and premium traditional wear with free shipping.";

  return (
    <div className="min-h-screen bg-white" data-testid="shop-page">
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords="luxury ethnic wear, designer suits, shop indian wear, lehengas online, traditional wear"
      />

      {/* Page Header */}
      <div className="bg-soft-pink py-16 md:py-24">
        <div className="luxury-container text-center">
          <p className="text-gold text-xs uppercase tracking-[0.3em] mb-3 font-semibold">Explore</p>
          <h1 className="text-4xl md:text-5xl font-serif text-stone-800">Our Collection</h1>
          <p className="text-stone-500 mt-4">
            {total} {total === 1 ? "piece" : "pieces"} of elegance
          </p>
        </div>
      </div>

      <div className="luxury-container py-12 md:py-16">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-28">
              <h3 className="text-xs uppercase tracking-[0.2em] text-stone-400 font-semibold mb-6">Refine By</h3>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter & Sort Bar */}
            <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b border-stone-100">
              {/* Mobile Filter Button */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <button
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-stone-200 text-stone-600 hover:border-pink-200 hover:text-pink-600 transition-all text-sm"
                    data-testid="mobile-filter-btn"
                  >
                    <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-pink-600 text-white text-[10px] flex items-center justify-center font-bold">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] p-0">
                  <div className="bg-white h-full p-8">
                    <SheetHeader className="mb-8">
                      <SheetTitle className="text-left font-serif text-xl">Refine By</SheetTitle>
                    </SheetHeader>
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-stone-400 uppercase tracking-wider hidden sm:inline">Sort</span>
                <Select
                  value={`${sortBy}-${sortOrder}`}
                  onValueChange={(value) => {
                    const [by, order] = value.split("-");
                    setSortBy(by);
                    setSortOrder(order);
                  }}
                >
                  <SelectTrigger className="w-[180px] rounded-full border-stone-200 text-sm" data-testid="sort-select">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {selectedCategory && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-full text-sm font-medium">
                    {categories.find(c => c.slug === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory("")} className="hover:text-pink-900">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {selectedBrand && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-full text-sm font-medium">
                    {selectedBrand}
                    <button onClick={() => setSelectedBrand("")} className="hover:text-pink-900">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {filterNew && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold-dark rounded-full text-sm font-medium">
                    New Arrivals
                    <button onClick={() => setFilterNew(false)} className="hover:text-gold">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {filterSale && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-full text-sm font-medium">
                    On Sale
                    <button onClick={() => setFilterSale(false)} className="hover:text-pink-900">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <div className="aspect-[3/4] skeleton-luxury rounded-2xl"></div>
                    <div className="h-3 skeleton-luxury rounded w-1/3 mx-auto"></div>
                    <div className="h-5 skeleton-luxury rounded w-2/3 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-stone-500 text-lg mb-4">No products found</p>
                <button
                  onClick={clearFilters}
                  className="text-pink-600 hover:text-pink-700 font-medium text-sm"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12 stagger-animate" data-testid="products-grid">
                {products.map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
