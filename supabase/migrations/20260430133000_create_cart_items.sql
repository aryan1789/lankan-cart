create table if not exists public.cart_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_external_id text not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, product_external_id)
);

alter table public.cart_items enable row level security;

drop policy if exists "users_select_own_cart_items" on public.cart_items;
create policy "users_select_own_cart_items"
  on public.cart_items for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users_insert_own_cart_items" on public.cart_items;
create policy "users_insert_own_cart_items"
  on public.cart_items for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users_update_own_cart_items" on public.cart_items;
create policy "users_update_own_cart_items"
  on public.cart_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users_delete_own_cart_items" on public.cart_items;
create policy "users_delete_own_cart_items"
  on public.cart_items for delete
  to authenticated
  using (auth.uid() = user_id);
