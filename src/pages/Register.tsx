import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const ok = await register(form.name.trim(), form.email.trim(), form.password, form.phone.trim() || undefined);
    if (ok) {
      navigate('/', { replace: true });
    } else {
      setError('An account with this email already exists.');
    }
  };

  const field = (
    label: string,
    key: keyof typeof form,
    type = 'text',
    placeholder = ''
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        required={key !== 'phone'}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#00B140] focus:ring-2 focus:ring-green-100 text-sm"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="font-semibold text-gray-800">Create Account</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🛒</div>
            <h1 className="text-2xl font-bold text-gray-900">Join LankaCart</h1>
            <p className="text-gray-500 mt-1 text-sm">Authentic Sri Lankan groceries in New Zealand</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {field('Full Name', 'name', 'text', 'Ashan Perera')}
            {field('Email Address', 'email', 'email', 'you@example.com')}
            {field('Phone Number (optional)', 'phone', 'tel', '+64 21 234 5678')}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:border-[#00B140] focus:ring-2 focus:ring-green-100 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#00B140] focus:ring-2 focus:ring-green-100 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#00B140] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#039A5A] disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#00B140] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
