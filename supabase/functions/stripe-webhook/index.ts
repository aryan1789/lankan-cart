import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17.4.0';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function buildOrderEmailHtml(order: Record<string, unknown>, items: Record<string, unknown>[]) {
  const fulfillment = escapeHtml(String(order.fulfillment_type ?? ''));
  const addr = order.delivery_address ? escapeHtml(String(order.delivery_address)) : '';
  const pickup = order.pickup_location ? escapeHtml(String(order.pickup_location)) : '';
  const total = escapeHtml(String(order.total ?? ''));
  const subtotal = escapeHtml(String(order.subtotal ?? ''));
  const delivery = escapeHtml(String(order.delivery_fee ?? ''));
  const currency = escapeHtml(String(order.currency ?? 'nzd')).toUpperCase();

  const rows = items
    .map(
      (it) => `
    <tr>
      <td style="padding:8px;border:1px solid #eee;">${escapeHtml(String(it.product_name ?? ''))}</td>
      <td style="padding:8px;border:1px solid #eee;">${escapeHtml(String(it.unit ?? ''))}</td>
      <td style="padding:8px;border:1px solid #eee;text-align:right;">${escapeHtml(String(it.quantity ?? ''))}</td>
      <td style="padding:8px;border:1px solid #eee;text-align:right;">${escapeHtml(String(it.unit_price ?? ''))}</td>
    </tr>`
    )
    .join('');

  return `
  <h2>New paid order</h2>
  <p><strong>Order ID:</strong> ${escapeHtml(String(order.id ?? ''))}</p>
  <p><strong>Fulfillment:</strong> ${fulfillment}</p>
  ${addr ? `<p><strong>Delivery / notes:</strong><br/><pre style="white-space:pre-wrap;font-family:inherit;">${addr}</pre></p>` : ''}
  ${pickup ? `<p><strong>Pickup:</strong><br/><pre style="white-space:pre-wrap;font-family:inherit;">${pickup}</pre></p>` : ''}
  <p><strong>Subtotal:</strong> ${currency} ${subtotal}</p>
  <p><strong>Delivery fee:</strong> ${currency} ${delivery}</p>
  <p><strong>Total:</strong> ${currency} ${total}</p>
  <h3>Items</h3>
  <table style="border-collapse:collapse;width:100%;max-width:720px;">
    <thead><tr><th align="left" style="padding:8px;border:1px solid #eee;">Product</th><th align="left" style="padding:8px;border:1px solid #eee;">Unit</th><th align="right" style="padding:8px;border:1px solid #eee;">Qty</th><th align="right" style="padding:8px;border:1px solid #eee;">Price</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response('Server misconfigured', { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 });
  }

  const body = await req.text();
  const cryptoProvider = Stripe.createSubtleCryptoProvider();
  const stripe = new Stripe(stripeSecret, {
    appInfo: { name: 'LankanCart' },
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, cryptoProvider);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'invalid payload';
    console.error('stripe signature', msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id ?? session.client_reference_id;
    if (!orderId) {
      console.error('checkout.session.completed missing order id');
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: order, error: orderErr } = await admin.from('orders').select('*').eq('id', orderId).maybeSingle();

    if (orderErr || !order) {
      console.error('order lookup', orderErr?.message);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (order.status === 'paid') {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: updErr } = await admin.from('orders').update({ status: 'paid' }).eq('id', orderId);
    if (updErr) {
      console.error('order update', updErr.message);
      return new Response('Failed to update order', { status: 500 });
    }

    const { data: items } = await admin.from('order_items').select('*').eq('order_id', orderId);

    const resendKey = Deno.env.get('RESEND_API_KEY');
    const to = Deno.env.get('ORDER_NOTIFICATION_EMAIL') ?? 'gargmaalav@gmail.com';
    const from = Deno.env.get('RESEND_FROM_EMAIL') ?? 'LankanCart <onboarding@resend.dev>';

    if (resendKey) {
      const html = buildOrderEmailHtml(order as Record<string, unknown>, (items ?? []) as Record<string, unknown>[]);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: `LankanCart — paid order ${orderId}`,
          html,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        console.error('Resend error', res.status, t);
      }
    } else {
      console.warn('RESEND_API_KEY not set; skipping email');
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
