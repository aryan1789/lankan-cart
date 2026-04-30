import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, LogOut, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { searchProducts } from '../data/products';
import type { Product } from '../types';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef<number | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setSuggestions([]);
      setShowSearch(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
  };

  useEffect(() => {
    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
    }

    if (query.trim().length <= 1) {
      queueMicrotask(() => {
        setSuggestions([]);
        setIsSearching(false);
      });
      return;
    }

    searchTimer.current = window.setTimeout(async () => {
      setIsSearching(true);
      const results = await searchProducts(query.trim());
      setSuggestions(results.slice(0, 5));
      setIsSearching(false);
    }, 250);

    return () => {
      if (searchTimer.current) {
        window.clearTimeout(searchTimer.current);
      }
    };
  }, [query]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center h-14 gap-4">
          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <span className="font-bold text-[#00B140] text-base tracking-tight">LankaCart</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-lg relative">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={query}
                  onChange={e => handleQueryChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-[#00B140] focus:ring-1 focus:ring-[#00B140] text-sm bg-gray-50"
                />
              </div>
            </form>
            {(suggestions.length > 0 || isSearching) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-md border border-gray-200 overflow-hidden z-50">
                {isSearching && (
                  <div className="px-3 py-2.5 text-sm text-gray-500">Searching...</div>
                )}
                {suggestions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { navigate(`/product/${p.id}`); setQuery(''); setSuggestions([]); }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
                  >
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-9 h-9 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-gray-100 shrink-0 flex items-center justify-center text-sm">🛒</div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{p.name}</div>
                      <div className="text-xs text-gray-500">${p.price.toFixed(2)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link to="/categories" className="px-3 py-1.5 text-gray-600 hover:text-[#00B140] font-medium rounded hover:bg-green-50 transition-colors">
              Categories
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto md:ml-0">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="md:hidden p-2 rounded hover:bg-gray-100 text-gray-600"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link to="/cart" className="relative flex items-center gap-1.5 px-3 py-2 rounded hover:bg-gray-100 text-gray-700 transition-colors">
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:block text-sm font-medium">Cart</span>
              {totalItems > 0 && (
                <span className="bg-[#00B140] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-1.5 px-2 py-2 rounded hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  <div className="w-7 h-7 bg-[#00B140] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.name[0]?.toUpperCase() ?? '?'
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white shadow-lg rounded-md border border-gray-200 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <div className="text-sm font-semibold text-gray-800">{user.name}</div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">{user.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        setShowMenu(false);
                        navigate('/');
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:block">Sign in</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="md:hidden pb-3 relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search products..."
                  value={query}
                  onChange={e => handleQueryChange(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-[#00B140] text-sm bg-gray-50"
                />
                <button type="button" onClick={() => { setShowSearch(false); setQuery(''); setSuggestions([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
            {(suggestions.length > 0 || isSearching) && (
              <div className="absolute left-0 right-0 top-full mt-0 bg-white shadow-lg rounded-md border border-gray-200 overflow-hidden z-50">
                {isSearching && (
                  <div className="px-3 py-2.5 text-sm text-gray-500">Searching...</div>
                )}
                {suggestions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { navigate(`/product/${p.id}`); setQuery(''); setSuggestions([]); setShowSearch(false); }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
                  >
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-9 h-9 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-gray-100 shrink-0 flex items-center justify-center text-sm">🛒</div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{p.name}</div>
                      <div className="text-xs text-gray-500">${p.price.toFixed(2)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />}
    </header>
  );
}
