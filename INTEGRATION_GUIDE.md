# Lankan Cart - Supabase & Payment Integration Guide

## Project Overview
You're building a Sri Lankan groceries eCommerce platform for the Auckland market, based on the successful Dubai version (lankancart.ae). The goal is to migrate from hardcoded data to a fully functional database with payments.

---

## RECOMMENDED TECH STACK & PAYMENT SOLUTION

### Payment Gateway: **STRIPE**
**Why Stripe is the best choice for NZ:**
- ✅ Full support for NZ-based businesses and customers
- ✅ Accepts credit/debit cards (Visa, Mastercard, American Express)
- ✅ Support for online banking via Stripe Payment Element
- ✅ Can process NZD (New Zealand Dollars)
- ✅ Webhook support for order notifications
- ✅ Advanced fraud detection built-in
- ✅ Excellent documentation and developer experience
- ✅ Competitive pricing (~2.4% + NZ$0.30 per transaction)

**Alternative for NZ:** PayPal (but Stripe is more commonly used in NZ eCommerce)

### Email Service: **SendGrid or Mailgun**
- SendGrid: Free tier 100 emails/day, $14.95/month for 50k emails
- Mailgun: Free tier 5,000 emails/month
- Both support transactional emails required for order confirmations

---

## STEP-BY-STEP INTEGRATION PLAN

### PHASE 1: SUPABASE SETUP (FOUNDATION)

#### Step 1.1: Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-react
npm install stripe @stripe/react-stripe-js @stripe/stripe-js
npm install nodemailer  # or use API instead
npm install dotenv
```

#### Step 1.2: Create Supabase Database Schema

**Tables to create:**

1. **`users`** (extends Supabase auth)
   ```sql
   id (UUID, PK) - links to auth.users
   email (text, unique)
   name (text)
   phone (text, nullable)
   address (text, nullable)
   city (text, nullable)
   postal_code (text, nullable)
   created_at (timestamp)
   updated_at (timestamp)
   ```

2. **`categories`**
   ```sql
   id (UUID, PK)
   name (text, unique)
   icon (text) - emoji or URL
   color (text) - hex color
   bg_color (text) - hex color
   description (text, nullable)
   created_at (timestamp)
   ```

3. **`products`**
   ```sql
   id (UUID, PK)
   category_id (UUID, FK -> categories)
   name (text)
   description (text)
   price (decimal)
   original_price (decimal, nullable)
   image_url (text)
   unit (text) - e.g., "5kg bag"
   weight (text, nullable)
   in_stock (boolean)
   rating (decimal)
   review_count (integer)
   origin (text, nullable)
   created_at (timestamp)
   updated_at (timestamp)
   ```

4. **`product_tags`**
   ```sql
   id (UUID, PK)
   product_id (UUID, FK -> products)
   tag (text)
   ```

5. **`orders`**
   ```sql
   id (UUID, PK)
   user_id (UUID, FK -> users)
   total_price (decimal)
   status (text) - 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
   payment_intent_id (text) - from Stripe
   delivery_type (text) - 'delivery' or 'pickup'
   delivery_address (text, nullable)
   delivery_city (text, nullable)
   delivery_postal_code (text, nullable)
   pickup_location (text, nullable)
   delivery_date_requested (date, nullable)
   estimated_delivery (date, nullable)
   created_at (timestamp)
   updated_at (timestamp)
   ```

6. **`order_items`**
   ```sql
   id (UUID, PK)
   order_id (UUID, FK -> orders)
   product_id (UUID, FK -> products)
   quantity (integer)
   price_at_purchase (decimal)
   ```

7. **`deliveries`** (track delivery progress)
   ```sql
   id (UUID, PK)
   order_id (UUID, FK -> orders)
   status (text) - 'pending', 'dispatched', 'out_for_delivery', 'delivered'
   dispatch_date (timestamp, nullable)
   estimated_delivery (date, nullable)
   actual_delivery (timestamp, nullable)
   notes (text, nullable)
   ```

#### Step 1.3: Create Environment Variables
Create `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_key
VITE_STRIPE_SECRET_KEY=sk_test_your_stripe_key (backend only)
VITE_SENDGRID_API_KEY=your_sendgrid_api_key
VITE_ADMIN_EMAIL=gargmaalav@gmail.com
```

---

### PHASE 2: AUTHENTICATION MIGRATION

#### Step 2.1: Update AuthContext to use Supabase
**Replace localStorage auth with Supabase Auth**

Key changes:
- Use `supabase.auth.signUp()` for registration
- Use `supabase.auth.signInWithPassword()` for login
- Use `supabase.auth.signOut()` for logout
- Use `supabase.auth.onAuthStateChange()` for session persistence
- Store user profile in `users` table

#### Step 2.2: Set up Row Level Security (RLS)
```sql
-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Products are public read
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Orders: users can only view/create their own
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

### PHASE 3: DATA MIGRATION

#### Step 3.1: Migrate Products & Categories
1. Export your current `products.ts` data
2. Create SQL INSERT statements or use Supabase import
3. Populate `categories` and `products` tables
4. Test queries with Supabase client

**Sample products for Auckland location:**
- Keep same categories as Dubai version
- Adjust prices for NZD (roughly 1.6-1.8x AED prices)
- Add local pickup locations (e.g., suburbs in Auckland)

---

### PHASE 4: STRIPE PAYMENT INTEGRATION

#### Step 4.1: Set up Stripe Account
1. Create account at stripe.com
2. Get API keys (public and secret)
3. Create products/prices in Stripe dashboard
4. Set up webhook endpoint for payment confirmations

#### Step 4.2: Create Checkout Flow
**Checkout page should include:**
1. **Order Review**
   - Cart items with prices
   - Subtotal, tax, delivery fee

2. **Delivery Options**
   - Home delivery ($5-15)
   - Pickup from locations (free or $2)
   - Date selector

3. **Address Form** (for delivery)
   - Street address
   - City (preset to Auckland)
   - Postal code

4. **Pickup Locations** (if selected)
   - Dropdown list of pickup points
   - Store hours

5. **Payment Method**
   - Stripe Payment Element (handles cards + more)

#### Step 4.3: Handle Payment Processing
```typescript
// Flow:
1. User clicks "Pay Now"
2. Create Stripe Payment Intent via backend
3. Confirm payment in frontend with stripe.confirmPayment()
4. On success:
   - Create order in database with status: 'paid'
   - Send confirmation email
   - Clear cart
   - Redirect to success page
```

---

### PHASE 5: EMAIL NOTIFICATIONS

#### Step 5.1: Set up Email Service
**Using SendGrid (easiest):**
1. Create account at sendgrid.com
2. Verify sender email (gargmaalav@gmail.com)
3. Get API key
4. Set up email templates

**Email templates needed:**
1. **Order Confirmation (to customer)**
   - Order number
   - Items ordered
   - Total price
   - Delivery address or pickup location
   - Estimated delivery date

2. **Admin Notification (to gargmaalav@gmail.com)**
   - Order details
   - Customer name & phone
   - Full address or pickup location
   - Payment confirmation
   - Action buttons (mark shipped, etc.)

---

### PHASE 6: CART & ORDER MANAGEMENT

#### Step 6.1: Update Cart Context
- Keep existing CartContext but add order creation functionality
- On checkout: create order record in Supabase
- Link cart items to order_items table

#### Step 6.2: Track Order Status
- Add order status page in Account
- Show: pending → paid → shipped → delivered
- Display estimated delivery date
- Allow order history view

---

## IMPLEMENTATION SEQUENCE (Priority Order)

### Week 1: Foundation
1. Set up Supabase project & database schema
2. Update AuthContext to use Supabase
3. Migrate products data to database

### Week 2: Core Features
4. Update product fetching to use Supabase queries
5. Set up Stripe account & integration
6. Create checkout page

### Week 3: Payments & Emails
7. Implement Stripe payment processing
8. Set up SendGrid for email notifications
9. Create email templates

### Week 4: Polish
10. Order tracking and history
11. Admin dashboard basics (optional)
12. Testing and bug fixes

---

## KEY FILES TO CREATE/MODIFY

```
src/
├── utils/
│   ├── supabase.ts          (NEW - Supabase client)
│   ├── stripe.ts            (NEW - Stripe utilities)
│   └── email.ts             (NEW - Email service)
├── context/
│   ├── AuthContext.tsx       (MODIFY - use Supabase)
│   └── CartContext.tsx       (MODIFY - add order creation)
├── pages/
│   ├── Checkout.tsx          (NEW - payment page)
│   ├── OrderConfirmation.tsx (NEW - success page)
│   └── Account.tsx           (MODIFY - add order history)
├── components/
│   └── PaymentForm.tsx       (NEW - Stripe form)
└── types/
    └── index.ts             (MODIFY - add Order type)
```

---

## IMMEDIATE ACTION ITEMS

### 1. **Supabase Setup** (This week)
- [ ] Create Supabase project
- [ ] Create all tables
- [ ] Test database connections
- [ ] Set up RLS policies

### 2. **Stripe Account** (This week)
- [ ] Create Stripe account
- [ ] Verify NZ address
- [ ] Get API keys
- [ ] Set up webhook endpoint

### 3. **SendGrid Setup** (This week)
- [ ] Create SendGrid account
- [ ] Verify gargmaalav@gmail.com
- [ ] Create email templates
- [ ] Get API key

### 4. **Environment Configuration** (This week)
- [ ] Create .env.local with all keys
- [ ] Add to .gitignore
- [ ] Test connections

---

## TESTING CHECKLIST

- [ ] User registration & login with Supabase
- [ ] Products load from database
- [ ] Add to cart and checkout
- [ ] Stripe test payment (use 4242 4242 4242 4242)
- [ ] Order created in database
- [ ] Confirmation email sent
- [ ] Admin email received
- [ ] Order history displays
- [ ] Delivery address saved

---

## PRICING ESTIMATES (Annual)

- **Supabase**: Free tier ample for start (or ~$25/month)
- **Stripe**: ~2.4% + NZ$0.30 per transaction (no monthly fee)
- **SendGrid**: ~$15-30/month
- **Hosting** (Vercel): Free or $20/month
- **Total**: ~$40-75/month

---

## SECURITY CHECKLIST

- ✅ Use RLS policies (never trust client)
- ✅ Validate addresses server-side
- ✅ Never expose secret keys in frontend
- ✅ Use HTTPS only (Vercel handles this)
- ✅ Sanitize email templates
- ✅ Rate limit checkout (prevent abuse)
- ✅ Verify Stripe webhook signatures

---

## NEXT STEP
Start with **Supabase setup** - once database is ready, everything else builds on top of it.
Would you like me to help you set up any specific part first?
