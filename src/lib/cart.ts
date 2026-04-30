import { supabase } from '../utils/supabase';

export type CartRow = {
  product_external_id: string;
  quantity: number;
};

export async function fetchUserCartRows(userId: string): Promise<CartRow[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('product_external_id,quantity')
    .eq('user_id', userId);

  if (error) {
    console.error('fetchUserCartRows', error.message);
    return [];
  }

  return ((data as CartRow[] | null) ?? []).filter((row) => row.quantity > 0);
}

export async function replaceUserCartRows(userId: string, rows: CartRow[]): Promise<boolean> {
  if (rows.length === 0) {
    const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
    if (error) {
      console.error('replaceUserCartRows clear', error.message);
      return false;
    }
    return true;
  }

  const { error: upsertError } = await supabase.from('cart_items').upsert(
    rows.map((row) => ({
      user_id: userId,
      product_external_id: row.product_external_id,
      quantity: Math.max(1, Math.floor(row.quantity)),
    })),
    { onConflict: 'user_id,product_external_id' }
  );

  if (upsertError) {
    console.error('replaceUserCartRows upsert', upsertError.message);
    return false;
  }

  const keepIds = new Set(rows.map((row) => row.product_external_id));
  const { data: existingRows, error: existingError } = await supabase
    .from('cart_items')
    .select('product_external_id')
    .eq('user_id', userId);

  if (existingError) {
    console.error('replaceUserCartRows existing', existingError.message);
    return false;
  }

  const staleIds = ((existingRows as { product_external_id: string }[] | null) ?? [])
    .map((row) => row.product_external_id)
    .filter((id) => !keepIds.has(id));

  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .in('product_external_id', staleIds);

    if (deleteError) {
      console.error('replaceUserCartRows delete stale', deleteError.message);
      return false;
    }
  }

  return true;
}
