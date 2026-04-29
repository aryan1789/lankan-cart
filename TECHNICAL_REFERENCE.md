# Technical Implementation Reference

## SUPABASE SCHEMA - SQL CREATE STATEMENTS

Copy and paste these into Supabase SQL Editor to create your tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  bg_color TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT NOT NULL,
  unit TEXT NOT NULL,
  weight TEXT,
  in_stock BOOLEAN DEFAULT true,
  rating DECIMAL(3,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  origin TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Product Tags Table
CREATE TABLE product_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag TEXT NOT NULL
);

-- Users Profile Table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT DEFAULT 'Auckland',
  postal_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
  payment_intent_id TEXT,
  delivery_type TEXT CHECK (delivery_type IN ('delivery', 'pickup')) NOT NULL,
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_postal_code TEXT,
  pickup_location TEXT,
  delivery_date_requested DATE,
  estimated_delivery DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Deliveries Table
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'dispatched', 'out_for_delivery', 'delivered')) DEFAULT 'pending',
  dispatch_date TIMESTAMP,
  estimated_delivery DATE,
  actual_delivery TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_product_tags ON product_tags(product_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_deliveries_order ON deliveries(order_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categories: public read
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Products: public read
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

-- Product Tags: public read
CREATE POLICY "Product tags are viewable by everyone"
  ON product_tags FOR SELECT
  USING (true);

-- Users: can view/update own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Orders: can view/insert own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Order Items: can view own items
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Deliveries: can view own deliveries
CREATE POLICY "Users can view own deliveries"
  ON deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = deliveries.order_id
      AND orders.user_id = auth.uid()
    )
  );
```

---

## CODE EXAMPLES

### 1. Supabase Client Setup

**File: `src/utils/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = any; // Type this properly when ready
```

### 2. Updated AuthContext (Supabase)

**File: `src/context/AuthContext.tsx` (excerpt)**
```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    setIsLoading(true);
    try {
      // Sign up with auth
      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!authUser) throw new Error('Sign up failed');

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email,
          name,
          phone: phone || null,
        });

      if (profileError) throw profileError;

      await loadUserProfile(authUser.id);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (authUser) await loadUserProfile(authUser.id);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

### 3. Updated Product Data Fetching

**File: `src/data/products.ts` (refactored)**
```typescript
import { supabase } from '../utils/supabase';
import type { Product, Category } from '../types';

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*');
  
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  
  return data.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    bgColor: cat.bg_color,
    count: 0, // Update with product count
  }));
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_tags(tag),
      category:categories(name)
    `);
  
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  
  return data.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.original_price,
    image: p.image_url,
    category: p.category.name,
    unit: p.unit,
    inStock: p.in_stock,
    rating: p.rating,
    reviewCount: p.review_count,
    tags: p.product_tags?.map((t: any) => t.tag) || [],
    origin: p.origin,
    weight: p.weight,
  }));
}

export async function searchProducts(query: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_tags(tag),
      category:categories(name)
    `)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  
  if (error) {
    console.error('Search error:', error);
    return [];
  }
  
  return data.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.original_price,
    image: p.image_url,
    category: p.category.name,
    unit: p.unit,
    inStock: p.in_stock,
    rating: p.rating,
    reviewCount: p.review_count,
    tags: p.product_tags?.map((t: any) => t.tag) || [],
    origin: p.origin,
    weight: p.weight,
  }));
}
```

### 4. Stripe Integration

**File: `src/utils/stripe.ts`**
```typescript
import { loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<any> = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
}

// Create payment intent (call from backend)
export async function createPaymentIntent(amount: number, orderId: string) {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, orderId }),
  });
  
  const data = await response.json();
  return data.clientSecret;
}
```

### 5. Email Service

**File: `src/utils/email.ts`**
```typescript
import { supabase } from './supabase';

interface OrderEmail {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; qty: number; price: number }>;
  totalPrice: number;
  deliveryAddress?: string;
  pickupLocation?: string;
  estimatedDelivery: string;
}

export async function sendOrderConfirmation(data: OrderEmail) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.customerEmail,
        template: 'order_confirmation',
        data,
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendAdminNotification(data: OrderEmail & { customerPhone?: string }) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: import.meta.env.VITE_ADMIN_EMAIL,
        template: 'admin_notification',
        data,
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending admin email:', error);
    throw error;
  }
}
```

### 6. Create Order Function

**File: `src/utils/orders.ts`**
```typescript
import { supabase } from './supabase';
import type { CartItem } from '../types';

export interface CreateOrderData {
  userId: string;
  items: CartItem[];
  totalPrice: number;
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryPostalCode?: string;
  pickupLocation?: string;
  deliveryDateRequested?: string;
  paymentIntentId: string;
}

export async function createOrder(data: CreateOrderData) {
  try {
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: data.userId,
        total_price: data.totalPrice,
        payment_intent_id: data.paymentIntentId,
        delivery_type: data.deliveryType,
        delivery_address: data.deliveryAddress,
        delivery_city: data.deliveryCity,
        delivery_postal_code: data.deliveryPostalCode,
        pickup_location: data.pickupLocation,
        delivery_date_requested: data.deliveryDateRequested,
        status: 'paid',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const itemsToInsert = data.items.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price_at_purchase: item.product.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    // Create delivery record
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + (data.deliveryType === 'delivery' ? 3 : 1));

    const { error: deliveryError } = await supabase
      .from('deliveries')
      .insert({
        order_id: order.id,
        estimated_delivery: estimatedDelivery.toISOString().split('T')[0],
      });

    if (deliveryError) throw deliveryError;

    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}
```

---

## MIGRATION STEPS FOR DUBAI DATA

To copy Dubai website products:

1. **Export current products.ts as JSON**
2. **Map to Supabase schema:**
   ```json
   {
     "name": "Samba Rice",
     "description": "...",
     "price": 12.99,
     "category": "rice-grains",
     "unit": "5kg bag",
     "image_url": "https://...",
     "in_stock": true,
     "rating": 4.8,
     "review_count": 124,
     "origin": "Kurunegala, Sri Lanka"
   }
   ```

3. **Use Supabase CSV import or SQL INSERT**

---

## ENVIRONMENT VARIABLES SETUP

Create `.env.local` in root:
```
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=eyJhbGc...

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51... # Backend only

# SendGrid
VITE_SENDGRID_API_KEY=SG.xxxx...

# Admin
VITE_ADMIN_EMAIL=gargmaalav@gmail.com
```

Add to `.gitignore`:
```
.env.local
.env*.local
```

---

## TESTING STRIPE PAYMENTS

Use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires 3D Secure**: 4000 2500 0000 3155

Expiry: Any future date
CVC: Any 3 digits

---

## COMMON ISSUES & SOLUTIONS

**Issue**: "CORS error when calling Stripe API"
**Solution**: API calls must come from backend (Node.js function), not frontend

**Issue**: "RLS policy denies access"
**Solution**: Ensure user is authenticated and `auth.uid()` matches the record owner

**Issue**: "Product images not loading"
**Solution**: Ensure image URLs are publicly accessible or use Supabase Storage

**Issue**: "Webhook not receiving Stripe events"
**Solution**: Whitelist Stripe IP ranges in firewall; use ngrok for local testing

