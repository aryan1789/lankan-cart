import { Link } from 'react-router-dom';
import { Star, Plus, Minus } from 'lucide-react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addToCart, items, updateQuantity } = useCart();
  const cartQty = items.find(i => i.product.id === product.id)?.quantity ?? 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col hover:border-gray-300 transition-colors">
      <Link to={`/product/${product.id}`} className="relative block bg-gray-50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-40 object-cover"
          loading="lazy"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-500 border border-gray-300 px-2 py-1 rounded bg-white">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <Link to={`/product/${product.id}`} className="flex-1">
          <p className="text-xs text-gray-400 mb-0.5">{product.unit}</p>
          <h3 className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 hover:text-[#00B140] transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mt-2">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
          <span className="text-xs text-gray-500">{product.rating} ({product.reviewCount})</span>
        </div>

        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="min-w-0">
            <span className="font-semibold text-gray-900 text-sm">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through ml-1.5">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {cartQty === 0 ? (
            <button
              onClick={() => product.inStock && addToCart(product)}
              disabled={!product.inStock}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded border border-[#00B140] text-[#00B140] hover:bg-[#00B140] hover:text-white disabled:border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          ) : (
            <div className="shrink-0 flex items-center border border-[#00B140] rounded overflow-hidden">
              <button
                onClick={() => updateQuantity(product.id, cartQty - 1)}
                className="px-2 py-1.5 text-[#00B140] hover:bg-green-50 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 text-xs font-semibold text-gray-800 min-w-[20px] text-center">
                {cartQty}
              </span>
              <button
                onClick={() => updateQuantity(product.id, cartQty + 1)}
                className="px-2 py-1.5 text-[#00B140] hover:bg-green-50 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
