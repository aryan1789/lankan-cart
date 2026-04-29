import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCategoryById, getProductsByCategory } from '../data/products';
import type { Category, Product } from '../types';
import ProductCard from '../components/ProductCard';

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [catProducts, setCatProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: category.bgColor }}
              >
                {category.icon}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{category.name}</h1>
                <p className="text-xs text-gray-500 mt-0.5">{catProducts.length} products</p>
              </div>
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
            {catProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
