import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpDown } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getCategoryById, getProductsByCategory } from '../data/products';
import type { Category, Product } from '../types';
import ProductCard from '../components/ProductCard';

type SortOption = 'default' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc';

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [catProducts, setCatProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const [cat, products] = await Promise.all([
        getCategoryById(id),
        getProductsByCategory(id),
      ]);
      if (!active) return;
      setCategory(cat);
      setCatProducts(products);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const sortedProducts = useMemo(() => {
    let sorted = [...catProducts];
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
  }, [catProducts, sortBy]);

  if (!loading && !category) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-2">Category not found.</p>
        <Link to="/categories" className="text-[#00B140] text-sm hover:underline">Browse categories</Link>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-10">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/categories" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
            <ArrowLeft className="w-4 h-4" /> Categories
          </Link>
          {category && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: category.bgColor }}
                >
                  {category.icon}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{category.name}</h1>
                  <p className="text-xs text-gray-500 mt-0.5">{sortedProducts.length} products</p>
                </div>
              </div>

              {sortedProducts.length > 0 && (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <ArrowUpDown className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => setSortBy('default')}
                      className={`w-full text-left px-4 py-2.5 text-sm ${sortBy === 'default' ? 'bg-green-50 text-[#00B140] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Default
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
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-center py-12 text-sm text-gray-500">Loading products...</div>
        )}
        {catProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-3">No products in this category yet.</p>
            <Link to="/" className="text-[#00B140] text-sm hover:underline">Back to home</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sortedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
