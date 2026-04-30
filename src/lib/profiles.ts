import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

export type ProfileRow = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
};

/**
 * Keeps `profiles` in sync with auth. Adjust column names here if your table differs
 * (e.g. `name` instead of `full_name`).
 */
export async function upsertProfileFromAuth(
  authUser: SupabaseUser,
  overrides?: { full_name?: string | null; phone?: string | null }
): Promise<void> {
  const meta = authUser.user_metadata as Record<string, unknown> | undefined;
  const metaName =
    (typeof meta?.full_name === 'string' && meta.full_name) ||
    (typeof meta?.name === 'string' && meta.name) ||
    null;
  const metaPhone = typeof meta?.phone === 'string' ? meta.phone : null;
  const metaAvatar =
    (typeof meta?.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta?.picture === 'string' && meta.picture) ||
    null;

  const full_name =
    overrides?.full_name ??
    metaName ??
    authUser.email?.split('@')[0] ??
    'Customer';

  const phone = overrides?.phone ?? metaPhone ?? null;
  const email = authUser.email ?? null;

  const variants: Array<Record<string, unknown>> = [
    { id: authUser.id, email, name: full_name, phone },
    { id: authUser.id, email, name: full_name },
    { id: authUser.id, email, full_name, phone },
    { id: authUser.id, email, full_name, phone, avatar_url: metaAvatar },
    { id: authUser.id, email, phone },
    { id: authUser.id, email },
    { id: authUser.id, name: full_name, phone },
    { id: authUser.id, name: full_name },
    { id: authUser.id, full_name, phone },
    { id: authUser.id, full_name, phone, avatar_url: metaAvatar },
    { id: authUser.id, phone },
    { id: authUser.id },
  ];

  let lastError: string | undefined;
  for (const payload of variants) {
    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (!error) return;
    lastError = error.message;
    const msg = error.message.toLowerCase();
    if (msg.includes('could not find the') && msg.includes('column')) {
      continue;
    }
    break;
  }

  if (lastError) {
    console.error('upsertProfileFromAuth', lastError);
  }
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const selects = [
    'id, name, email, phone',
    'id, name, phone',
    'id, full_name, email, phone, avatar_url',
    'id, full_name, email, phone',
    'id, full_name, phone',
    'id, name',
    'id, phone',
    'id',
  ];

  for (const select of selects) {
    const { data, error } = await supabase.from('profiles').select(select).eq('id', userId).maybeSingle();
    if (!error) return data as ProfileRow | null;
    const msg = error.message.toLowerCase();
    if (
      (msg.includes('could not find the') && msg.includes('column')) ||
      (msg.includes('column') && msg.includes('does not exist'))
    ) continue;
    console.error('fetchProfile', error.message);
    return null;
  }

  return null;
}

export async function updateProfilePhone(userId: string, phone: string | null): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({ phone }).eq('id', userId);

  if (error) {
    console.error('updateProfilePhone', error.message);
    return false;
  }
  return true;
}
