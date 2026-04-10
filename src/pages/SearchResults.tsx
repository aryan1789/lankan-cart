import { useSearchParams, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchProducts } from '../data/products';
import ProductCard from '../components/ProductCard';

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const results = query ? searchProducts(query) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-5 h-5 text-gray-400" />
        <h1 className="text-xl font-bold text-gray-900">
          {query ? `Results for "${query}"` : 'Search'}
        </h1>
      </div>
      {query && (
        <p className="text-sm text-gray-500 mb-6">
          {results.length} {results.length === 1 ? 'product' : 'products'} found
        </p>
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

      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
