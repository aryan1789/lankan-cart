import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createCheckoutSession, createOrderWithItems, type FulfillmentType } from '../lib/orders';

const FREE_DELIVERY_THRESHOLD = 50;
const DELIVERY_FEE = 8;

const PICKUP_OPTIONS = [
  { id: 'pickup-mt-albert', label: 'Pickup — Mount Albert, Auckland (details TBC)' },
  { id: 'pickup-central', label: 'Pickup — Central Auckland (details TBC)' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { user, session, isBootstrapping: authBootstrapping } = useAuth();
  const { items, totalPrice, clearCart } = useCart();

  const [fulfillment, setFulfillment] = useState<FulfillmentType>('delivery');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [suburb, setSuburb] = useState('');
  const [postcode, setPostcode] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupId, setPickupId] = useState(PICKUP_OPTIONS[0]?.id ?? '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authBootstrapping && !user) {
      navigate('/login', { state: { from: '/checkout' }, replace: true });
    }
  }, [authBootstrapping, user, navigate]);

  const delivery = totalPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const finalTotal = useMemo(() => totalPrice + delivery, [totalPrice, delivery]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!session) {
      setError('Your session expired. Please sign in again.');
      return;
    }

    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    if (fulfillment === 'delivery') {
      if (!line1.trim() || !suburb.trim() || !postcode.trim()) {
        setError('Please fill in street address, suburb, and postcode.');
        return;
      }
    }

    setSubmitting(true);

    const deliveryAddress =
      fulfillment === 'delivery'
        ? [
            line1.trim(),
            line2.trim(),
            `${suburb.trim()} ${postcode.trim()}`,
            (phone.trim() || user?.phone || '').trim() ? `Phone: ${(phone.trim() || user?.phone || '').trim()}` : '',
            notes.trim() ? `Notes: ${notes.trim()}` : '',
          ]
            .filter(Boolean)
            .join('\n')
        : null;

    const pickupLocation =
      fulfillment === 'pickup'
        ? [PICKUP_OPTIONS.find((p) => p.id === pickupId)?.label ?? pickupId, notes.trim() ? `Notes: ${notes.trim()}` : '']
            .filter(Boolean)
            .join('\n')
        : null;

    const order = await createOrderWithItems({
      fulfillmentType: fulfillment,
      deliveryAddress,
      pickupLocation,
      subtotal: totalPrice,
      deliveryFee: delivery,
      total: finalTotal,
      currency: 'nzd',
      items,
    });

    if ('error' in order) {
      setError(order.error);
      setSubmitting(false);
      return;
    }

    const checkout = await createCheckoutSession(order.orderId);
    if ('error' in checkout) {
      setError(checkout.error);
      setSubmitting(false);
      return;
    }

    clearCart();
    window.location.href = checkout.url;
  };

  if (authBootstrapping || !user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-sm text-gray-500">Loading…</div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-4">Your cart is empty.</p>
        <Link to="/" className="text-[#00B140] font-semibold text-sm">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-28 md:pb-10">
      <div className="flex items-center gap-2 mb-6">
        <button type="button" onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Checkout</h1>
      </div>

      <form onSubmit={handlePay} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Fulfillment</h2>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="fulfillment"
                checked={fulfillment === 'delivery'}
                onChange={() => setFulfillment('delivery')}
                className="accent-[#00B140]"
              />
              Delivery
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="fulfillment"
                checked={fulfillment === 'pickup'}
                onChange={() => setFulfillment('pickup')}
                className="accent-[#00B140]"
              />
              Pickup
            </label>
          </div>
        </section>

        {fulfillment === 'delivery' && (
          <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Delivery address</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Street address</label>
              <input
                required
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
                placeholder="Unit / street number and name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Line 2 (optional)</label>
              <input
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
                placeholder="Building, gate code, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Suburb / city</label>
                <input
                  required
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
                  placeholder="Auckland"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Postcode</label>
                <input
                  required
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
                  placeholder="1024"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact phone</label>
              <input
                value={phone || user?.phone || ''}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
                placeholder="+64 …"
              />
            </div>
          </section>
        )}

        {fulfillment === 'pickup' && (
          <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Pickup location</h2>
            <select
              value={pickupId}
              onChange={(e) => setPickupId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm bg-white"
            >
              {PICKUP_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">Exact address and hours will be confirmed by email after payment.</p>
          </section>
        )}

        <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Order notes (optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
            placeholder="Allergies, delivery instructions, etc."
          />
        </section>

        <section className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span>NZD ${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span className={delivery === 0 ? 'text-[#00B140] font-medium' : ''}>
              {delivery === 0 ? 'Free' : `NZD $${DELIVERY_FEE.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>NZD ${finalTotal.toFixed(2)}</span>
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#00B140] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#039A5A] disabled:opacity-70 transition-colors"
        >
          {submitting ? 'Starting payment…' : 'Pay with Stripe'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          You will be redirected to Stripe to pay by card. After payment succeeds, we email the shop with your order
          details.
        </p>
      </form>
    </div>
  );
}
