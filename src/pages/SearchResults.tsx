import { useSearchParams, Link } from 'react-router-dom';
import { Search, ArrowUpDown } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { searchProducts } from '../data/products';
import ProductCard from '../components/ProductCard';
import type { Product } from '../types';

type SortOption = 'relevance' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc';

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!query) {
        setResults([]);
        return;
      }
      setLoading(true);
      const data = await searchProducts(query);
      if (!active) return;
      setResults(data);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [query]);

  const sortedResults = useMemo(() => {
    let sorted = [...results];
    if (sortBy === 'price-low') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    }
    return sorted;
  }, [results, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <h1 className="text-xl font-bold text-gray-900">
            {query ? `Results for "${query}"` : 'Search'}
          </h1>
        </div>
        {results.length > 0 && (
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowUpDown className="w-4 h-4 text-gray-600" />
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => setSortBy('relevance')}
                className={`w-full text-left px-4 py-2.5 text-sm ${sortBy === 'relevance' ? 'bg-green-50 text-[#00B140] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                Relevance
              </button>
              <button
                onClick={() => setSortBy('price-low')}
                className={`w-full text-left px-4 py-2.5 text-sm border-t ${sortBy === 'price-low' ? 'bg-green-50 text-[#00B140] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                Price: Low to High
              </button>
              <button
                onClick={() => setSortBy('price-high')}
                className={`w-full text-left px-4 py-2.5 text-sm border-t ${sortBy === 'price-high' ? 'bg-green-50 text-[#00B140] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                Price: High to Low
              </button>
              <button
                onClick={() => setSortBy('name-asc')}
                className={`w-full text-left px-4 py-2.5 text-sm border-t ${sortBy === 'name-asc' ? 'bg-green-50 text-[#00B140] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                Name: A to Z
              </button>
              <button
                onClick={() => setSortBy('name-desc')}
                className={`w-full text-left px-4 py-2.5 text-sm border-t ${sortBy === 'name-desc' ? 'bg-green-50 text-[#00B140] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                Name: Z to A
              </button>
            </div>
          </div>
        )}
      </div>

      {query && (
        <p className="text-sm text-gray-500 mb-6">
          {sortedResults.length} {sortedResults.length === 1 ? 'product' : 'products'} found
        </p>
      )}

      {loading && query && (
        <div className="text-sm text-gray-500">Searching...</div>
      )}

      {results.length === 0 && query && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-lg font-semibold text-gray-700">No products found</h2>
          <p className="text-gray-400 text-sm mt-1 mb-6">
            Try searching for something else like "rice", "cinnamon" or "mango"
          </p>
          <Link to="/" className="text-[#00B140] font-medium hover:underline">
            Back to home
          </Link>
        </div>
      )}

      {sortedResults.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedResults.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
