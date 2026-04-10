import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { categories, getFeaturedProducts, products } from '../data/products';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const { user } = useAuth();
  const featured = getFeaturedProducts();
  const deals = products.filter(p => p.originalPrice).slice(0, 4);

  return (
    <div className="pb-24 md:pb-10">
      {/* Hero */}
      <section className="bg-[#00B140] text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
          <p className="text-sm text-green-200 mb-2">Delivering across New Zealand</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-xl">
            {user
              ? `Welcome back, ${user.name.split(' ')[0]}`
              : 'Authentic Sri Lankan groceries'}
          </h1>
          <p className="mt-3 text-green-100 text-sm md:text-base max-w-md">
            {user
              ? 'Your favourite Sri Lankan products, ready to order.'
              : 'Samba rice, Ceylon cinnamon, fresh vegetables and more — shipped to your door.'}
          </p>
          <div className="flex gap-3 mt-6">
            <Link
              to="/categories"
              className="bg-white text-[#00B140] px-5 py-2.5 rounded font-semibold text-sm hover:bg-green-50 transition-colors"
            >
              Shop now
            </Link>
            {!user && (
              <Link
                to="/register"
                className="border border-white/50 text-white px-5 py-2.5 rounded font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Create account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Shop by category</h2>
          <Link to="/categories" className="text-sm text-[#00B140] hover:underline flex items-center gap-0.5">
            All categories <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center text-xl transition-transform group-hover:scale-105"
                style={{ backgroundColor: cat.bgColor }}
              >
                {cat.icon}
              </div>
              <span className="text-xs text-gray-600 text-center leading-tight">
                {cat.name.split(' ')[0]}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Deals */}
      {deals.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">On special</h2>
          </div>
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
