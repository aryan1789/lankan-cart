import { Link } from 'react-router-dom';
import { categories } from '../data/products';

export default function Categories() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-10">
      <h1 className="text-xl font-semibold text-gray-900 mb-5">All categories</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map(cat => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-[#00B140] transition-colors"
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-105"
              style={{ backgroundColor: cat.bgColor }}
            >
              {cat.icon}
            </div>
            <h3 className="font-medium text-gray-800 text-sm">{cat.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{cat.count} products</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
