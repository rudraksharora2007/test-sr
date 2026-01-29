import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { Checkbox } from "../components/ui/checkbox";
import ProductCard from "../components/ProductCard";
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

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          axios.get(`${API}/categories`),
          axios.get(`${API}/brands`)
        ]);
        setCategories(catRes.data);
        setBrands(brandRes.data.brands);
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
        if (selectedCategory) params.set("category_id", categories.find(c => c.slug === selectedCategory)?.category_id || "");
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
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="font-semibold mb-3">Categories</h4>
        <div className="space-y-2">
          {categories.map((category) => (
            <label 
              key={category.category_id} 
              className="flex items-center gap-2 cursor-pointer"
              data-testid={`filter-category-${category.slug}`}
            >
              <Checkbox 
                checked={selectedCategory === category.slug}
                onCheckedChange={(checked) => setSelectedCategory(checked ? category.slug : "")}
              />
              <span className="text-sm">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="font-semibold mb-3">Brands</h4>
        <div className="space-y-2">
          {brands.map((brand) => (
            <label 
              key={brand} 
              className="flex items-center gap-2 cursor-pointer"
              data-testid={`filter-brand-${brand.toLowerCase().replace(' ', '-')}`}
            >
              <Checkbox 
                checked={selectedBrand === brand}
                onCheckedChange={(checked) => setSelectedBrand(checked ? brand : "")}
              />
              <span className="text-sm">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Special Filters */}
      <div>
        <h4 className="font-semibold mb-3">Filter By</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer" data-testid="filter-new-arrivals">
            <Checkbox 
              checked={filterNew}
              onCheckedChange={(checked) => { setFilterNew(checked); if(checked) setFilterSale(false); }}
            />
            <span className="text-sm">New Arrivals</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer" data-testid="filter-on-sale">
            <Checkbox 
              checked={filterSale}
              onCheckedChange={(checked) => { setFilterSale(checked); if(checked) setFilterNew(false); }}
            />
            <span className="text-sm">On Sale</span>
          </label>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={clearFilters}
          data-testid="clear-filters-btn"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" data-testid="shop-page">
      {/* Page Header */}
      <div className="bg-white py-8 border-b">
        <div className="section-container">
          <h1 className="text-3xl md:text-4xl font-serif text-center">Shop Collection</h1>
          <p className="text-gray-500 text-center mt-2">
            {total} {total === 1 ? "product" : "products"}
          </p>
        </div>
      </div>

      <div className="section-container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white p-6 border sticky top-24">
              <h3 className="font-semibold text-lg mb-6">Filters</h3>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter & Sort Bar */}
            <div className="flex items-center justify-between gap-4 mb-6">
              {/* Mobile Filter Button */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="outline" data-testid="mobile-filter-btn">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="ml-2 bg-pink-700 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 hidden sm:inline">Sort by:</span>
                <Select 
                  value={`${sortBy}-${sortOrder}`} 
                  onValueChange={(value) => {
                    const [by, order] = value.split("-");
                    setSortBy(by);
                    setSortOrder(order);
                  }}
                >
                  <SelectTrigger className="w-[180px]" data-testid="sort-select">
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
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                    {categories.find(c => c.slug === selectedCategory)?.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory("")} />
                  </span>
                )}
                {selectedBrand && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                    {selectedBrand}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedBrand("")} />
                  </span>
                )}
                {filterNew && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gold/20 text-gold-dark rounded-full text-sm">
                    New Arrivals
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterNew(false)} />
                  </span>
                )}
                {filterSale && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                    On Sale
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterSale(false)} />
                  </span>
                )}
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="product-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse"></div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No products found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="product-grid" data-testid="products-grid">
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
