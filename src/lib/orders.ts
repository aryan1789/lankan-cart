import { supabase } from '../utils/supabase';
import type { CartItem } from '../types';
import { fetchProfile } from './profiles';

export type FulfillmentType = 'delivery' | 'pickup';

export type OrderStatus = 'pending_payment' | 'paid' | 'cancelled' | 'failed';

export interface CreateOrderInput {
  fulfillmentType: FulfillmentType;
  /** Full delivery address (when fulfillmentType is delivery) */
  deliveryAddress: string | null;
  /** Pickup location label (when fulfillmentType is pickup) */
  pickupLocation: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency?: string;
  items: CartItem[];
}

export async function countUserOrders(): Promise<number> {
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('countUserOrders', error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Inserts an order and line items. Expects RLS to allow authenticated users
 * to insert their own rows (see Supabase policies you apply in the dashboard).
 */
export async function createOrderWithItems(input: CreateOrderInput): Promise<{ orderId: string } | { error: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'You must be signed in to place an order.' };
  }

  const profile = await fetchProfile(user.id);
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const customerName =
    profile?.full_name ||
    profile?.name ||
    (typeof meta?.full_name === 'string' && meta.full_name) ||
    (typeof meta?.name === 'string' && meta.name) ||
    user.email?.split('@')[0] ||
    'Customer';
  const customerEmail = user.email ?? '';
  const customerPhone =
    profile?.phone || (typeof meta?.phone === 'string' ? meta.phone : '') || '';

  const applyNullFallback = (payload: Record<string, unknown>, columnName: string) => {
    switch (columnName) {
      case 'customer_name':
      case 'full_name':
      case 'name':
        payload[columnName] = customerName;
        return true;
      case 'customer_email':
      case 'email':
        payload[columnName] = customerEmail;
        return true;
      case 'customer_phone':
      case 'phone':
        payload[columnName] = customerPhone;
        return true;
      case 'delivery_address':
        payload[columnName] = input.deliveryAddress ?? input.pickupLocation ?? 'N/A';
        return true;
      case 'pickup_location':
        payload[columnName] = input.pickupLocation ?? 'Pickup';
        return true;
      case 'fulfillment_type':
        payload[columnName] = input.fulfillmentType;
        return true;
      case 'fulfillment':
        payload[columnName] = input.fulfillmentType;
        return true;
      case 'subtotal':
        payload[columnName] = input.subtotal;
        return true;
      case 'delivery_fee':
        payload[columnName] = input.deliveryFee;
        return true;
      case 'status':
        payload[columnName] = 'pending_payment';
        return true;
      case 'total':
        payload[columnName] = input.total;
        return true;
      case 'user_id':
        payload[columnName] = user.id;
        return true;
      default:
        return false;
    }
  };

  const currency = (input.currency ?? 'nzd').toLowerCase();
  const payloadVariants = [
    {
      user_id: user.id,
      status: 'pending_payment' as OrderStatus,
      fulfillment_type: input.fulfillmentType,
      delivery_address: input.deliveryAddress,
      pickup_location: input.pickupLocation,
      subtotal: input.subtotal,
      delivery_fee: input.deliveryFee,
      total: input.total,
      currency,
    },
    {
      user_id: user.id,
      status: 'pending_payment' as OrderStatus,
      fulfillment_type: input.fulfillmentType,
      delivery_address: input.deliveryAddress,
      pickup_location: input.pickupLocation,
      subtotal: input.subtotal,
      delivery_fee: input.deliveryFee,
      total: input.total,
    },
    {
      user_id: user.id,
      status: 'pending_payment' as OrderStatus,
      subtotal: input.subtotal,
      delivery_fee: input.deliveryFee,
      total: input.total,
    },
    {
      user_id: user.id,
      status: 'pending_payment' as OrderStatus,
      total: input.total,
    },
  ];

  let orderRow: { id: string } | null = null;
  let orderErrorMessage: string | undefined;

  for (const payloadVariant of payloadVariants) {
    const payload: Record<string, unknown> = { ...payloadVariant };
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { data, error } = await supabase
        .from('orders')
        .insert(payload)
        .select('id')
        .single();

      if (!error && data?.id) {
        orderRow = data as { id: string };
        break;
      }

      const msg = error?.message?.toLowerCase() ?? '';
      orderErrorMessage = error?.message;
      if (msg.includes('could not find the') && msg.includes('column')) {
        break;
      }

      const nullColumn = error?.message?.match(/null value in column "([^"]+)"/i)?.[1];
      if (nullColumn && applyNullFallback(payload, nullColumn)) {
        continue;
      }
      break;
    }
    if (orderRow?.id) break;
  }

  if (!orderRow?.id) {
    console.error('createOrder', orderErrorMessage);
    return { error: orderErrorMessage ?? 'Could not create order.' };
  }

  const orderId = orderRow.id as string;

  const canonicalLineRows: Record<string, unknown>[] = input.items.map((line) => ({
    order_id: orderId,
    product_external_id: line.product.id,
    product_name: line.product.name,
    product_id: line.product.id,
    name: line.product.name,
    unit: line.product.unit,
    unit_price: line.product.price,
    price: line.product.price,
    quantity: line.quantity,
    qty: line.quantity,
    line_total: line.product.price * line.quantity,
  }));

  const workingRows = canonicalLineRows.map((row) => ({ ...row }));
  const fillItemFallback = (columnName: string) => {
    for (const [idx, line] of input.items.entries()) {
      const row = workingRows[idx];
      if (!row) continue;
      switch (columnName) {
        case 'order_id':
          row.order_id = orderId;
          break;
        case 'product_external_id':
        case 'product_id':
          row[columnName] = line.product.id;
          break;
        case 'product_name':
        case 'name':
          row[columnName] = line.product.name;
          break;
        case 'unit':
          row.unit = line.product.unit;
          break;
        case 'unit_price':
        case 'price':
          row[columnName] = line.product.price;
          break;
        case 'quantity':
        case 'qty':
          row[columnName] = line.quantity;
          break;
        case 'line_total':
        case 'total':
        case 'amount':
          row[columnName] = line.product.price * line.quantity;
          break;
        default:
          return false;
      }
    }
    return true;
  };

  let itemsErrorMessage: string | undefined;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { error: itemsError } = await supabase.from('order_items').insert(workingRows);
    if (!itemsError) {
      itemsErrorMessage = undefined;
      break;
    }

    itemsErrorMessage = itemsError.message;
    const msg = itemsError.message.toLowerCase();
    const missingColumn = itemsError.message.match(/could not find the '([^']+)' column/i)?.[1];
    if (missingColumn) {
      for (const row of workingRows) {
        delete row[missingColumn];
      }
      continue;
    }

    const nullColumn = itemsError.message.match(/null value in column "([^"]+)"/i)?.[1];
    if (nullColumn && fillItemFallback(nullColumn)) {
      continue;
    }

    if (msg.includes('violates not-null constraint')) {
      break;
    }
    break;
  }

  if (itemsErrorMessage) {
    console.error('createOrder items', itemsErrorMessage);
    return { error: itemsErrorMessage };
  }

  return { orderId };
}

export async function createCheckoutSession(orderId: string): Promise<{ url: string } | { error: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { error: 'Your session expired. Please sign in again.' };
  }

  const appOrigin = window.location.origin.replace(/\/$/, '');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '');
  const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_KEY,
    },
    body: JSON.stringify({ orderId, appOrigin }),
  });

  const payload = (await res.json()) as { url?: string; error?: string };

  if (!res.ok) {
    return { error: payload.error ?? 'Payment session could not be started.' };
  }

  if (!payload.url) {
    return { error: 'Payment session could not be started.' };
  }

  return { url: payload.url };
}
