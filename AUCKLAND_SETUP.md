# Auckland-Specific Setup & Configuration

## LOCATION & PRICING FOR AUCKLAND

### Currency
- **NZD (New Zealand Dollars)** - format: $X.XX
- Stripe supports NZD transactions

### Delivery Areas
Define pickup and delivery zones:

```typescript
// src/constants/locations.ts
export const PICKUP_LOCATIONS = [
  {
    id: 'britomart',
    name: 'Britomart, Central Auckland',
    address: 'Britomart Transport Centre, Queen Street',
    hours: 'Mon-Fri: 8am-6pm, Sat: 10am-4pm',
    latitude: -37.0421,
    longitude: 174.7648,
  },
  {
    id: 'parnell',
    name: 'Parnell',
    address: 'Parnell Road, Parnell',
    hours: 'Daily: 8am-7pm',
    latitude: -37.0298,
    longitude: 174.7816,
  },
  {
    id: 'mt-eden',
    name: 'Mount Eden',
    address: 'Mount Eden Village',
    hours: 'Daily: 9am-6pm',
    latitude: -37.0743,
    longitude: 174.7637,
  },
  {
    id: 'west-auckland',
    name: 'West Auckland',
    address: 'New Lynn / Ranui area',
    hours: 'Sat-Sun: 10am-4pm',
    latitude: -37.0819,
    longitude: 174.5794,
  },
];

export const DELIVERY_ZONES = [
  {
    id: 'central-auckland',
    name: 'Central Auckland',
    suburbs: ['Britomart', 'Parnell', 'Ponsonby', 'Grey Lynn', 'Karangahape'],
    fee: 5.00,
    days: '2-3 business days',
  },
  {
    id: 'inner-auckland',
    name: 'Inner Auckland',
    suburbs: ['Mount Eden', 'Epsom', 'Remuera', 'Newmarket', 'Glen Innes', 'Onehunga'],
    fee: 5.00,
    days: '2-3 business days',
  },
  {
    id: 'south-auckland',
    name: 'South Auckland',
    suburbs: ['Panmure', 'Otahuhu', 'Mangere', 'Papatoetoe', 'Flatbush'],
    fee: 7.50,
    days: '3-4 business days',
  },
  {
    id: 'north-shore',
    name: 'North Shore',
    suburbs: ['Takapuna', 'Devonport', 'Milford', 'Glenfield', 'Northcote'],
    fee: 7.50,
    days: '3-4 business days',
  },
  {
    id: 'west-auckland',
    name: 'West Auckland',
    suburbs: ['New Lynn', 'Ranui', 'Massey', 'Henderson', 'Swanson'],
    fee: 10.00,
    days: '3-4 business days',
  },
  {
    id: 'east-auckland',
    name: 'East Auckland',
    suburbs: ['Howick', 'Botany', 'Pakuranga', 'Dannemora'],
    fee: 10.00,
    days: '3-4 business days',
  },
];
```

### Sample Product Pricing (AUD → NZD)

Dubai prices in AED roughly convert to NZD at:
- 1 AED ≈ 0.42 NZD
- But for NZ market, add markup: multiply by 1.8-2.0x AED

Example:
```
Dubai version:
- Samba Rice (5kg): AED 45 → NZD $18-20

Auckland version:
- Samba Rice (5kg): $19.99 NZD (set to catch local market)
```

---

## SUPABASE REGION SELECTION

**Recommended**: Sydney or Auckland (if available)
- **Best**: Select region closest to users for low latency
- Supabase regions: US, EU, APAC (Asia Pacific)
- APAC region will serve Auckland well

---

## STRIPE SETUP FOR NEW ZEALAND

### Account Requirements
1. Go to stripe.com
2. Create account (New Zealand)
3. Business information:
   - Business name: Lankan Cart NZ (or your entity)
   - Address: Your Auckland address
   - Phone: NZ number
4. Bank account: NZ bank details for payouts
5. Get API keys from Dashboard > Developers > API Keys

### Setting Local Currency to NZD
In Stripe Dashboard:
1. Settings > Business Settings
2. Currency: Select NZD
3. All transactions will be in NZD

### Create Products in Stripe (Optional - for future)
If you want to manage products in Stripe:
```
Product: Samba Rice 5kg
- Price: $19.99 NZD
- Description: Traditional Sri Lankan short-grain samba rice
- Image: [upload product image]
```

---

## SENDGRID EMAIL TEMPLATES

### Template 1: Order Confirmation (to customer)

**Subject**: Your LankaCart Order #{{orderNumber}} is Confirmed!

**HTML Body**:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #00B140; color: white; padding: 20px; text-align: center;">
    <h1>Order Confirmed! 🎉</h1>
  </div>

  <div style="padding: 20px; border-bottom: 1px solid #eee;">
    <p>Hi {{customerName}},</p>
    <p>Thanks for your order! We've received your payment and your items are being prepared.</p>
  </div>

  <div style="padding: 20px; border-bottom: 1px solid #eee;">
    <h2>Order Details</h2>
    <p><strong>Order Number:</strong> {{orderNumber}}</p>
    <p><strong>Order Date:</strong> {{orderDate}}</p>
    <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
  </div>

  <div style="padding: 20px; border-bottom: 1px solid #eee;">
    <h2>Items Ordered</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #ddd;">
        <th style="text-align: left; padding: 10px;">Product</th>
        <th style="text-align: center; padding: 10px;">Quantity</th>
        <th style="text-align: right; padding: 10px;">Price</th>
      </tr>
      {{#items}}
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">{{name}}</td>
        <td style="text-align: center; padding: 10px;">{{quantity}}</td>
        <td style="text-align: right; padding: 10px;">${{price}} NZD</td>
      </tr>
      {{/items}}
      <tr style="font-weight: bold;">
        <td colspan="2" style="text-align: right; padding: 10px;">Total:</td>
        <td style="text-align: right; padding: 10px;">${{totalPrice}} NZD</td>
      </tr>
    </table>
  </div>

  <div style="padding: 20px; border-bottom: 1px solid #eee;">
    <h2>Delivery Information</h2>
    {{#isDelivery}}
    <p><strong>Delivery Address:</strong></p>
    <p>{{deliveryAddress}}<br>{{deliveryCity}}, {{deliveryPostalCode}}</p>
    {{/isDelivery}}
    {{#isPickup}}
    <p><strong>Pickup Location:</strong></p>
    <p>{{pickupLocation}}</p>
    {{/isPickup}}
  </div>

  <div style="padding: 20px; background-color: #f5f5f7; text-align: center;">
    <p>You can track your order at: <a href="{{trackingUrl}}">View Order</a></p>
    <p style="font-size: 12px; color: #666; margin-top: 10px;">
      Questions? Email us at <strong>gargmaalav@gmail.com</strong>
    </p>
  </div>
</div>
```

### Template 2: Admin Notification

**Subject**: 🛒 NEW ORDER - {{orderNumber}} from {{customerName}}

**HTML Body**:
```html
<div style="font-family: Arial, sans-serif; background-color: #fff; padding: 20px;">
  <h2>New Order Received!</h2>

  <div style="background-color: #f5f5f7; padding: 15px; margin: 15px 0; border-radius: 5px;">
    <p><strong>Order #:</strong> {{orderNumber}}</p>
    <p><strong>Customer:</strong> {{customerName}}</p>
    <p><strong>Email:</strong> {{customerEmail}}</p>
    <p><strong>Phone:</strong> {{customerPhone}}</p>
    <p><strong>Total:</strong> ${{totalPrice}} NZD</p>
  </div>

  <h3>Delivery/Pickup</h3>
  {{#isDelivery}}
  <p><strong>Type:</strong> Home Delivery</p>
  <p><strong>Address:</strong><br>{{deliveryAddress}}<br>{{deliveryCity}}, {{deliveryPostalCode}}</p>
  <p><strong>Preferred Date:</strong> {{deliveryDateRequested}}</p>
  {{/isDelivery}}
  {{#isPickup}}
  <p><strong>Type:</strong> Pickup</p>
  <p><strong>Location:</strong> {{pickupLocation}}</p>
  {{/isPickup}}

  <h3>Items</h3>
  <ul>
    {{#items}}
    <li>{{name}} - Qty: {{quantity}} @ ${{price}} NZD</li>
    {{/items}}
  </ul>

  <p style="margin-top: 20px;">
    <a href="{{dashboardUrl}}" style="background-color: #00B140; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      View in Dashboard
    </a>
  </p>
</div>
```

---

## PAYMENT FLOW FOR NZ CUSTOMERS

### Step 1: Customer at Checkout
- Cart total: $X.XX NZD
- Select delivery/pickup
- Enter address
- Choose payment method

### Step 2: Stripe Payment
**Accepted methods via Stripe Payment Element:**
- Credit cards (Visa, Mastercard, Amex)
- Debit cards
- Apple Pay / Google Pay
- Bank transfers (via Stripe Connect - optional)

For online banking:
- Stripe doesn't directly support NZ banking apps (Westpac, ASB, ANZ apps)
- Alternative: Use **Sezzle** or **Afterpay** (popular in NZ)
- Or: Customers use Visa Debit card connected to their bank

### Step 3: Confirmation
- Email sent to customer
- Admin email sent to gargmaalav@gmail.com
- Order stored in database
- Delivery record created with estimated date

---

## AUCKLAND BUSINESS SETUP CHECKLIST

- [ ] **Business Registration**
  - Register business name (if not already done)
  - Get NZ Tax ID (IRD number)
  - Set up business bank account

- [ ] **Stripe Setup**
  - Create account with NZ address
  - Verify phone number
  - Add bank account for payouts
  - Set up webhook for payment events
  - Get API keys

- [ ] **SendGrid Setup**
  - Create account
  - Verify gargmaalav@gmail.com as sender
  - Create email templates
  - Get API key

- [ ] **Supabase Setup**
  - Create project
  - Create all tables
  - Set up RLS policies
  - Enable backups

- [ ] **Domain & Hosting**
  - Domain: lankancart.nz or similar
  - Hosting: Vercel (recommended for React)
  - SSL certificate (automatic with Vercel)

- [ ] **Compliance**
  - Privacy Policy (GDPR/NZ Privacy Act)
  - Terms of Service
  - Return/Refund Policy
  - Delivery Terms

---

## ESTIMATED MONTHLY RUNNING COSTS (NZD)

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Supabase | Free-25 | Free tier is generous |
| Stripe | Transaction fees only | ~2.4% + NZ$0.30 per transaction |
| SendGrid | 15-30 | For email notifications |
| Vercel | Free-20 | Free for small projects |
| Domain | 10-15 | Annually |
| **Total** | **~$40-90/month** | Plus transaction fees |

---

## AUCKLAND MARKET CONSIDERATIONS

### Competitor Analysis
- **Countdown Online**: Best for mainstream groceries
- **New World Online**: Competitor
- **Local Indian/Asian grocers**: Manual orders
- **Facebook groups**: Sri Lankan community ordering

### Advantages for LankaCart NZ
✅ Only dedicated Sri Lankan groceries online service
✅ Direct relationships with Auckland Sri Lankan community
✅ Quality & authenticity guarantees
✅ Fast pickup options in central suburbs

### Marketing Opportunities
1. **Facebook Groups**: "Sri Lankans in Auckland" groups
2. **Nextdoor App**: Local neighborhood targeting
3. **Google Local Services**: Appear in "Shop Online" results
4. **Sri Lankan Community Events**: Easter, New Year, Pongal

### Delivery Optimization Tips
- Partner with local delivery service (Flexport, Uber Eats delivery?)
- Or: Hire part-time driver for certain days
- Initial: Owner delivery for first 50-100 orders

---

## SAMPLE AUCKLAND LAUNCH PRICING

### Products (NZD - adjusted from Dubai AED)

**Rice & Grains**
- Samba Rice 5kg: $19.99
- Keeri Samba 5kg: $22.99
- Red Rice 5kg: $17.99

**Spices**
- Ceylon Cinnamon 100g: $8.99
- Curry Powder 200g: $6.99
- Turmeric Powder 100g: $5.50

**Delivery Fees**
- Central Auckland: $5.00
- Inner Auckland: $5.00
- South/North Shore: $7.50
- West/East Auckland: $10.00
- Pickup: FREE

**Minimum Order**
- No minimum (good for customer experience)
- Or: $20 minimum for free delivery? (Test & optimize)

---

## NEXT STEPS SPECIFIC TO AUCKLAND

1. **This Week**
   - [ ] Register Stripe account (NZ)
   - [ ] Register SendGrid
   - [ ] Create Supabase project

2. **Next Week**
   - [ ] Set up database schema
   - [ ] Configure environment variables
   - [ ] Test auth & payments with test data

3. **Week 3**
   - [ ] Migrate Dubai product data
   - [ ] Adjust prices for NZD
   - [ ] Add Auckland pickup locations

4. **Week 4**
   - [ ] Email templates ready
   - [ ] Test full checkout flow
   - [ ] Soft launch to friends/family

5. **Week 5+**
   - [ ] Public launch
   - [ ] Marketing push to community
   - [ ] Monitor orders & feedback
   - [ ] Scale delivery operations

