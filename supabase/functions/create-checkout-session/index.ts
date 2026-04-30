import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17.4.0';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function fetchOrderForCheckout(
  userClient: ReturnType<typeof createClient>,
  orderId: string
): Promise<{ order?: Record<string, unknown>; error?: { message: string } }> {
  const selectVariants = [
    'id,user_id,status,subtotal,delivery_fee,total,currency,fulfillment_type,delivery_address,pickup_location',
    'id,user_id,status,subtotal,delivery_fee,total,currency',
    'id,user_id,status,subtotal,delivery_fee,total',
    'id,user_id,status,total',
  ];

  let lastError: { message: string } | undefined;
  for (const select of selectVariants) {
    const { data, error } = await userClient.from('orders').select(select).eq('id', orderId).maybeSingle();
    if (!error && data) return { order: data as Record<string, unknown> };
    if (!error && !data) return {};
    const msg = error.message.toLowerCase();
    lastError = { message: error.message };
    if (
      (msg.includes('could not find the') && msg.includes('column')) ||
      (msg.includes('column') && msg.includes('does not exist'))
    ) continue;
    return { error: lastError };
  }

  return { error: lastError };
}

async function fetchOrderLinesForCheckout(
  userClient: ReturnType<typeof createClient>,
  orderId: string
): Promise<{ lines?: Array<{ name: string; unitPrice: number; quantity: number; unit?: string }>; error?: { message: string } }> {
  const selectVariants = [
    'product_name,unit_price,quantity,unit',
    'name,price,quantity,unit',
    'product_name,line_total,quantity,unit',
    'name,line_total,quantity,unit',
    'product_name,unit_price,qty,unit',
    'name,price,qty,unit',
    'product_name,line_total,qty,unit',
    'name,line_total,qty,unit',
  ];

  let lastError: { message: string } | undefined;
  for (const select of selectVariants) {
    const { data, error } = await userClient.from('order_items').select(select).eq('order_id', orderId);
    if (!error) {
      const rows = (data as Record<string, unknown>[] | null) ?? [];
      const lines = rows
        .map((row) => {
          const quantity = Math.max(1, Number(row.quantity ?? row.qty ?? 1));
          const explicitUnitPrice = Number(row.unit_price ?? row.price ?? 0);
          const lineTotal = Number(row.line_total ?? row.total ?? row.amount ?? 0);
          const unitPrice =
            explicitUnitPrice > 0
              ? explicitUnitPrice
              : lineTotal > 0
                ? lineTotal / quantity
                : 0;

          return {
            name: String(row.product_name ?? row.name ?? row.product_id ?? 'Item'),
            unitPrice,
            quantity,
            unit: row.unit ? String(row.unit) : undefined,
          };
        })
        .filter((row) => row.unitPrice > 0 && row.quantity > 0);
      return { lines };
    }
    const msg = error.message.toLowerCase();
    lastError = { message: error.message };
    if (
      (msg.includes('could not find the') && msg.includes('column')) ||
      (msg.includes('column') && msg.includes('does not exist'))
    ) continue;
    return { error: lastError };
  }

  return { error: lastError };
}

function isOriginAllowed(appOrigin: string): boolean {
  let u: URL;
  try {
    u = new URL(appOrigin);
  } catch {
    return false;
  }

  const normalizedOrigin = u.origin.replace(/\/$/, '');
  const isLocalDev =
    u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1');

  // Always allow localhost/127.0.0.1 in dev, even when allowlist is configured.
  if (isLocalDev) return true;

  const allowList = (Deno.env.get('ALLOWED_APP_ORIGINS') ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (allowList.length > 0) {
    return allowList.some((allowed) => {
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2).toLowerCase();
        const host = u.hostname.toLowerCase();
        return host === domain || host.endsWith(`.${domain}`);
      }
      return normalizedOrigin === allowed;
    });
  }

  if (u.protocol === 'https:') return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const body = (await req.json()) as { orderId?: string; appOrigin?: string };
    const orderId = body.orderId?.trim();
    const appOrigin = body.appOrigin?.trim();
    if (!orderId || !appOrigin) {
      return jsonResponse({ error: 'orderId and appOrigin are required' }, 400);
    }

    if (!isOriginAllowed(appOrigin)) {
      return jsonResponse({ error: 'Origin is not allowed' }, 403);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY');
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');

    if (!supabaseUrl || !supabaseAnon) {
      return jsonResponse({ error: 'Supabase env missing' }, 500);
    }
    if (!stripeSecret) {
      return jsonResponse({ error: 'Stripe is not configured' }, 500);
    }

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();

    if (userErr || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { order, error: orderErr } = await fetchOrderForCheckout(userClient, orderId);

    if (orderErr || !order) {
      return jsonResponse(
        {
          error: 'Order not found',
          debug: {
            orderId,
            detail: orderErr?.message ?? 'No row returned by order lookup',
          },
        },
        404
      );
    }

    if (order.user_id !== user.id) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    if (order.status !== 'pending_payment') {
      return jsonResponse({ error: 'This order cannot be paid' }, 400);
    }

    const { lines, error: linesErr } = await fetchOrderLinesForCheckout(userClient, orderId);

    const currency = String(order.currency ?? 'nzd').toLowerCase();

    let line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = (lines ?? []).map((row) => ({
      price_data: {
        currency,
        unit_amount: Math.round(Number(row.unitPrice) * 100),
        product_data: {
          name: String(row.name ?? 'Item'),
          description: row.unit ? String(row.unit) : undefined,
        },
      },
      quantity: Math.max(1, Number(row.quantity) || 1),
    }));

    if (line_items.length === 0) {
      const fallbackTotal = Math.round(Number(order.total ?? 0) * 100);
      if (fallbackTotal <= 0) {
        return jsonResponse(
          {
            error: 'Order has no items',
            debug: {
              orderId,
              detail: linesErr?.message ?? 'No usable item pricing found',
            },
          },
          400
        );
      }

      line_items = [
        {
          price_data: {
            currency,
            unit_amount: fallbackTotal,
            product_data: {
              name: `LankanCart order ${String(order.id ?? orderId).slice(0, 8)}`,
            },
          },
          quantity: 1,
        },
      ];
    }

    const deliveryFee = Number(order.delivery_fee ?? 0);
    if (deliveryFee > 0) {
      line_items.push({
        price_data: {
          currency,
          unit_amount: Math.round(deliveryFee * 100),
          product_data: { name: 'Delivery' },
        },
        quantity: 1,
      });
    }

    const stripe = new Stripe(stripeSecret, { appInfo: { name: 'LankanCart' } });
    const origin = new URL(appOrigin).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: orderId,
      customer_email: user.email ?? undefined,
      line_items,
      metadata: { order_id: orderId },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    });

    if (!session.url) {
      return jsonResponse({ error: 'Could not start checkout' }, 500);
    }

    return jsonResponse({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    console.error('create-checkout-session', message);
    return jsonResponse({ error: message }, 500);
  }
});
