import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const { pathname } = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();

  const tabs = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/categories', icon: Grid3X3, label: 'Browse' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: totalItems },
    { to: user ? '/account' : '/login', icon: User, label: user ? 'Account' : 'Sign in' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
      <div className="flex items-center justify-around">
        {tabs.map(tab => {
          const active = tab.to === '/' ? pathname === '/' : pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center gap-0.5 px-4 py-3 relative ${
                active ? 'text-[#00B140]' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <tab.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#00B140] text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
}
