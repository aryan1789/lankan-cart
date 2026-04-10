import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, ArrowRight, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ordered, setOrdered] = useState(false);

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    setOrdered(true);
    clearCart();
  };

  if (ordered) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#00B140]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order placed</h2>
          <p className="text-gray-500 text-sm mb-6">
            Thanks for shopping with LankaCart. We'll have your order ready shortly.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-6 text-left text-sm space-y-1 text-gray-600">
            <div>Estimated delivery: 2–4 business days</div>
          </div>
          <Link
            to="/"
            className="block w-full bg-[#00B140] text-white py-2.5 rounded font-semibold text-sm text-center hover:bg-[#039A5A] transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 pb-24 md:pb-10">
        <ShoppingBag className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Your cart is empty</h2>
        <p className="text-gray-400 text-sm mb-6">Add some products to get started.</p>
        <Link
          to="/"
          className="bg-[#00B140] text-white px-6 py-2.5 rounded font-semibold text-sm hover:bg-[#039A5A] transition-colors"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  const FREE_DELIVERY_THRESHOLD = 50;
  const DELIVERY_FEE = 8;
  const delivery = totalPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const finalTotal = totalPrice + delivery;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28 md:pb-10">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Cart ({totalItems})</h1>
      </div>

      <div className="md:flex gap-6 items-start">
        {/* Items */}
        <div className="flex-1 space-y-2">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4">
              <Link to={`/product/${product.id}`} className="shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-18 h-18 w-[72px] h-[72px] rounded object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${product.id}`}>
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-[#00B140]">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">{product.unit}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="px-2 py-1.5 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-medium text-gray-800 border-x border-gray-300">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="px-2 py-1.5 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-sm text-gray-900">${(product.price * quantity).toFixed(2)}</span>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="md:w-72 mt-4 md:mt-0 shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-20">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm">Order summary</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({totalItems} items)</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className={delivery === 0 ? 'text-[#00B140] font-medium' : ''}>
                  {delivery === 0 ? 'Free' : `$${DELIVERY_FEE.toFixed(2)}`}
                </span>
              </div>
            </div>

            {delivery > 0 && (
              <p className="text-xs text-gray-400 mt-2 bg-gray-50 rounded p-2">
                Spend ${(FREE_DELIVERY_THRESHOLD - totalPrice).toFixed(2)} more for free delivery
              </p>
            )}

            <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-semibold text-gray-900 text-sm">
              <span>Total</span>
              <span>NZD ${finalTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full mt-4 bg-[#00B140] text-white py-2.5 rounded font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#039A5A] transition-colors"
            >
              {user ? 'Place order' : 'Sign in to checkout'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link to="/" className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-3">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
