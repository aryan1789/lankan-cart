import { useNavigate, Link } from 'react-router-dom';
import { LogOut, ShoppingBag, User, Phone, Mail, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Account() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 pb-24 md:pb-8 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sign in to your account</h2>
        <p className="text-gray-500 text-sm mb-6">Access your orders, saved items and more</p>
        <Link
          to="/login"
          className="bg-[#00B140] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#039A5A] transition-colors"
        >
          Sign In
        </Link>
        <p className="mt-4 text-sm text-gray-400">
          New here?{' '}
          <Link to="/register" className="text-[#00B140] font-medium">Create account</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-[#00B140] to-[#039A5A] rounded-2xl p-6 text-white mb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-white/80 text-sm">{user.email}</p>
            {user.phone && <p className="text-white/70 text-xs mt-0.5">{user.phone}</p>}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-[#00B140]">{totalItems}</div>
          <div className="text-xs text-gray-500 mt-0.5">Items in Cart</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">0</div>
          <div className="text-xs text-gray-500 mt-0.5">Orders Placed</div>
        </div>
      </div>

      {/* Menu */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {[
            { icon: User, label: 'Personal Info', sub: user.name },
            { icon: Mail, label: 'Email', sub: user.email },
            { icon: Phone, label: 'Phone', sub: user.phone || 'Not set' },
            { icon: ShoppingBag, label: 'My Cart', sub: `${totalItems} items`, to: '/cart' },
          ].map(item => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => item.to && navigate(item.to)}
            >
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                <item.icon className="w-4 h-4 text-[#00B140]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">{item.label}</div>
                <div className="text-xs text-gray-400 truncate">{item.sub}</div>
              </div>
              {item.to && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={() => { logout(); navigate('/'); }}
        className="w-full mt-5 flex items-center justify-center gap-2 border-2 border-red-100 text-red-500 py-3.5 rounded-xl font-semibold hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </div>
  );
}
