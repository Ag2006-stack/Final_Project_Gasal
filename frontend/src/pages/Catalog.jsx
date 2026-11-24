import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '../api/endpoints';
import BottomSheet from '../components/BottomSheet';
import { IconSliders } from '../components/Icons';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/SkeletonLoader';
import { useDebounce } from '../hooks/useDebounce';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'components', label: 'Components' },
  { value: 'laptops', label: 'Laptops' },
  { value: 'monitors', label: 'Monitors' }
];

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [filterOpen, setFilterOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    productsApi
      .list({ q: debouncedSearch, category, brand, sort }, controller.signal)
      .then(({ data }) => {
        setProducts(Array.isArray(data) ? data : data?.items || []);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedSearch, category, brand, sort]);

  const selectCategoryChip = (val) => {
    setCategory(val);
    const next = {};
    if (search) next.q = search;
    if (val) next.category = val;
    if (brand) next.brand = brand;
    if (sort !== 'newest') next.sort = sort;
    setSearchParams(next);
  };

  const applyFilters = (e) => {
    e.preventDefault();
    const next = {};
    if (search) next.q = search;
    if (category) next.category = category;
    if (brand) next.brand = brand;
    if (sort !== 'newest') next.sort = sort;
    setSearchParams(next);
    setFilterOpen(false);
  };

  return (
    <section aria-labelledby="catalog-heading">
      <h1 id="catalog-heading" style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
        Hardware Catalog
      </h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <label htmlFor="catalog-search" style={{ position: 'absolute', left: '-9999px' }}>
          Search by brand or model
        </label>
        <input
          id="catalog-search"
          type="search"
          className="form-input"
          placeholder="Search ASUS, Ryzen, RTX, Monitors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setFilterOpen(true)}
          aria-label="Open filter and sort drawer"
        >
          <IconSliders size={16} />
          <span>Filter</span>
        </button>
      </div>

      <div className="chip-row" role="group" aria-label="Filter by category">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            className={`chip ${category === cat.value ? 'active' : ''}`}
            onClick={() => selectCategoryChip(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700 }}>No matching hardware found.</p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setSearch('');
              setCategory('');
              setBrand('');
              setSort('newest');
              setSearchParams({});
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <BottomSheet open={filterOpen} title="Filter & Sort Hardware" onClose={() => setFilterOpen(false)}>
        <form onSubmit={applyFilters}>
          <div className="form-group">
            <label htmlFor="filter-brand" className="form-label">Brand</label>
            <select
              id="filter-brand"
              className="form-input"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              <option value="">All Brands</option>
              <option value="ASUS">ASUS</option>
              <option value="AMD">AMD</option>
              <option value="MSI">MSI</option>
              <option value="Kingston">Kingston</option>
              <option value="Acer">Acer</option>
              <option value="Lenovo">Lenovo</option>
              <option value="AOC">AOC</option>
              <option value="LG">LG</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="filter-category" className="form-label">Category</label>
            <select
              id="filter-category"
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Hardware</option>
              <option value="components">PC Parts & Components</option>
              <option value="laptops">Laptops</option>
              <option value="monitors">Monitors</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="filter-sort" className="form-label">Sort By</label>
            <select
              id="filter-sort"
              className="form-input"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            Apply Filters
          </button>
        </form>
      </BottomSheet>
    </section>
  );
}