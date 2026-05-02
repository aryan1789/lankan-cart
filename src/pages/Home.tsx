import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getCategories, getProducts, getCategoriesWithHierarchy } from '../data/products';
import type { Category, Product } from '../types';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const [cats, prods] = await Promise.all([getCategories(), getProducts()]);
      if (!active) return;
      setCategories(cats);
      setProducts(prods);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const featured = useMemo(() => products.slice(0, 6), [products]);
  const deals = useMemo(() => products.slice(0, 4), [products]);
  const { parents, childrenMap } = useMemo(() => getCategoriesWithHierarchy(categories, products), [categories, products]);

  return (
    <div className="pb-24 md:pb-10">
      {/* Hero */}
      <section
        className="relative text-white overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%), url("https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=600&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 flex flex-col justify-center min-h-[500px]">
          <p className="text-sm md:text-base text-gray-100 mb-4 font-semibold tracking-wide">BUY AUTHENTIC SRI LANKAN GROCERIES IN THE UAE.</p>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight max-w-2xl mb-6 text-white drop-shadow-lg">
            {user
              ? `Welcome back, ${user.name.split(' ')[0]}`
              : 'Lankan Cart'}
          </h1>

          <p className="text-lg md:text-xl text-gray-100 max-w-2xl mb-8 leading-relaxed drop-shadow">
            {user
              ? 'Your favourite Sri Lankan products, ready to order.'
              : 'Fresh Sri Lankan vegetables, premium rice, spices, Ceylon tea, and dry foods delivered across Dubai and the UAE.'}
          </p>

          <div className="flex gap-3 mt-4">
            <Link
              to="/categories"
              className="bg-[#E91E63] hover:bg-[#C2185B] text-white px-8 py-3.5 rounded-full font-bold text-base transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              PLACE ORDER
            </Link>
            {!user && (
              <Link
                to="/register"
                className="border-2 border-white text-white px-8 py-3 rounded-full font-bold text-base hover:bg-white/10 transition-colors"
              >
                Create account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Shop by category</h2>
          <Link to="/categories" className="text-sm font-semibold text-[#00B140] hover:text-[#008C2E] flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {loading && (
          <div className="text-sm text-gray-500">Loading categories...</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {parents.map(parent => (
            <div key={parent.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
              <button
                onClick={() => setExpandedCategory(expandedCategory === parent.id ? null : parent.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: parent.bgColor }}
                  >
                    {parent.icon}
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="font-semibold text-gray-900 truncate">{parent.name}</h3>
                    <p className="text-xs text-gray-500">{parent.count} items</p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${
                    expandedCategory === parent.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedCategory === parent.id && (
                <div className="border-t border-gray-100 bg-gray-50">
                  {childrenMap.get(parent.id)?.map(child => (
                    <Link
                      key={child.id}
                      to={`/category/${child.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <span className="text-sm text-gray-700">{child.name}</span>
                      <span className="text-xs bg-white text-gray-600 px-2 py-1 rounded">{child.count}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Deals */}
      {deals.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">On special</h2>
          </div>
          {loading && (
            <div className="text-sm text-gray-500">Loading deals...</div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {deals.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="max-w-6xl mx-auto px-4 mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Top rated</h2>
          <Link to="/categories" className="text-sm text-[#00B140] hover:underline flex items-center gap-0.5">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {loading && (
          <div className="text-sm text-gray-500">Loading products...</div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {featured.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Simple value props */}
      <section className="max-w-6xl mx-auto px-4 mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-200 pt-8">
          {[
            { icon: '🌿', title: 'Locally sourced', desc: 'Direct from trusted suppliers' },
            { icon: '🚚', title: 'NZ-wide delivery', desc: 'Fast shipping nationwide' },
            { icon: '✓', title: 'Quality checked', desc: 'Every product inspected' },
            { icon: '$', title: 'Everyday prices', desc: 'No hidden fees' },
          ].map(item => (
            <div key={item.title} className="flex gap-3 items-start">
              <span className="text-lg mt-0.5 shrink-0">{item.icon}</span>
              <div>
                <div className="text-sm font-medium text-gray-800">{item.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
