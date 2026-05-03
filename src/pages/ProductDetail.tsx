import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, MapPin, Package, ChevronRight } from 'lucide-react';
import { getProductById, getProductsByCategory, getCategoryById } from '../data/products';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import type { Category, Product } from '../types';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, items, updateQuantity } = useCart();
  const [qty, setQty] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const productData = await getProductById(id);
      if (!active) return;
      setProduct(productData);
      if (!productData) {
        setCategory(null);
        setRelated([]);
        setLoading(false);
        return;
      }
      const [cat, relatedProducts] = await Promise.all([
        getCategoryById(productData.category),
        getProductsByCategory(productData.category),
      ]);
      if (!active) return;
      setCategory(cat);
      setRelated(relatedProducts.filter(p => p.id !== productData.id).slice(0, 4));
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (!loading && !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Product not found</h2>
        <Link to="/" className="text-sm text-[#00B140] hover:underline">Back to home</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-sm text-gray-500">
        Loading product...
      </div>
    );
  }

  const cartItem = items.find(i => i.product.id === product.id);

  return (
    <div className="pb-28 md:pb-10">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-gray-100 mr-1">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Link to="/" className="hover:text-[#00B140]">Home</Link>
          {category && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <Link to={`/category/${category.id}`} className="hover:text-[#00B140]">{category.name}</Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-700 truncate">{product.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden md:flex">
          {/* Image */}
          <div className="md:w-2/5 bg-gray-50 relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-72 md:h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="p-6 md:w-3/5">
            {category && (
              <Link
                to={`/category/${category.id}`}
                className="text-xs text-gray-500 hover:text-[#00B140] mb-2 inline-block"
              >
                {category.name}
              </Link>
            )}

            <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{product.unit}</p>

            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-base text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
              )}
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mt-4">{product.description}</p>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
              {product.origin && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {product.origin}
                </div>
              )}
              {product.weight && (
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  {product.weight}
                </div>
              )}
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {product.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Add to cart */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              {cartItem ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                    <button
                      onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                      className="px-3 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-sm font-semibold text-gray-800 border-x border-gray-300">
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                      className="px-3 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <Link
                    to="/cart"
                    className="flex items-center gap-2 bg-[#00B140] text-white px-5 py-2.5 rounded font-semibold text-sm hover:bg-[#039A5A] transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    View cart
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="px-3 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-sm font-semibold text-gray-800 border-x border-gray-300">{qty}</span>
                    <button
                      onClick={() => setQty(q => q + 1)}
                      className="px-3 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => product.inStock && addToCart(product, qty)}
                    disabled={!product.inStock}
                    className="flex items-center gap-2 bg-[#00B140] text-white px-5 py-2.5 rounded font-semibold text-sm hover:bg-[#039A5A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {product.inStock ? `Add to cart · $${(product.price * qty).toFixed(2)}` : 'Out of stock'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">You may also like</h2>
              {category && (
                <Link to={`/category/${category.id}`} className="text-sm text-[#00B140] hover:underline flex items-center gap-0.5">
                  See all <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
