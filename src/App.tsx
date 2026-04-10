import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Categories from './pages/Categories';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import SearchResults from './pages/SearchResults';
import Account from './pages/Account';

const HIDE_NAVBAR_ROUTES = ['/login', '/register'];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const hideNavbar = HIDE_NAVBAR_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <ScrollToTop />
      {!hideNavbar && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/account" element={<Account />} />
          {/* Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!hideNavbar && <BottomNav />}
    </div>
  );
}
