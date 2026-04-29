import type { Product, Category } from '../types';
import { supabase } from '../utils/supabase';

type CategoryRow = {
  external_id?: string | number | null;
  category_refid?: string | number | null;
  id?: string | number | null;
  name?: string | null;
  category_name?: string | null;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
  alternative_title?: string | null;
  parent_ref_id?: number | null;
};

type ProductRow = {
  external_id?: string | number | null;
  id?: string | number | null;
  name?: string | null;
  description?: string | null;
  price?: number | string | null;
  original_price?: number | string | null;
  image_url?: string | null;
  image?: string | null;
  category_external_id?: string | number | null;
  category_name?: string | null;
  unit?: string | null;
  in_stock?: boolean | null;
  active?: boolean | null;
  current_stock?: number | null;
  tax_rate?: number | null;
  rating?: number | null;
  review_count?: number | null;
  tags?: string | null;
  origin?: string | null;
  weight?: string | null;
};

const CATEGORY_COLORS = [
  { color: '#92400E', bgColor: '#FEF3C7' },
  { color: '#991B1B', bgColor: '#FEE2E2' },
  { color: '#065F46', bgColor: '#D1FAE5' },
  { color: '#1E40AF', bgColor: '#DBEAFE' },
  { color: '#7C3AED', bgColor: '#EDE9FE' },
  { color: '#0F766E', bgColor: '#CCFBF1' },
  { color: '#B45309', bgColor: '#FEF3C7' },
  { color: '#4B5563', bgColor: '#F3F4F6' },
];

const CATEGORY_ICON_MAP: Record<string, string> = {
  rice: '🍚',
  vegetable: '🥦',
  fruit: '🍌',
  snacks: '🥜',
  beverage: '🥤',
  tea: '☕',
  coffee: '☕',
  spice: '🌶️',
  coconut: '🥥',
  sambol: '🫙',
  pickle: '🥒',
  chutney: '🫙',
  sauces: '🍲',
  dairy: '🥛',
  bakery: '🥖',
  noodles: '🍜',
  grains: '🌾',
  organic: '🌿',
  ayurvedic: '🌿',
  fish: '🐟',
  dry: '🐟',
  canned: '🥫',
  honey: '🍯',
  syrup: '🍯',
  personal: '🧴',
  baby: '🍼',
};

const getCategoryIcon = (name: string) => {
  const key = name.toLowerCase();
  const match = Object.keys(CATEGORY_ICON_MAP).find((token) => key.includes(token));
  return match ? CATEGORY_ICON_MAP[match] : '🛒';
};

const mapCategory = (row: CategoryRow, index: number): Category => {
  const palette = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  return {
    id: String(row.external_id ?? row.category_refid ?? row.id ?? ''),
    name: row.name ?? row.category_name ?? 'Category',
    icon: getCategoryIcon(row.name ?? row.category_name ?? ''),
    color: palette.color,
    bgColor: palette.bgColor,
    count: 0,
  };
};

const mapProduct = (row: ProductRow): Product => ({
  id: String(row.external_id ?? row.id ?? ''),
  name: row.name ?? '',
  description: row.description ?? '',
  price: Number(row.price ?? 0),
  originalPrice: row.original_price ? Number(row.original_price) : undefined,
  image: row.image_url ?? row.image ?? '',
  category: String(row.category_external_id ?? row.category_name ?? ''),
  unit: row.unit ?? '',
  inStock: row.in_stock ?? (Number(row.current_stock ?? 0) > 0),
  rating: Number(row.rating ?? 4.5),
  reviewCount: Number(row.review_count ?? 0),
  tags: row.tags ? String(row.tags).split(',').map((t: string) => t.trim()) : [],
  origin: row.origin ?? undefined,
  weight: row.weight ?? undefined,
});

export const withCategoryCounts = (categories: Category[], products: Product[]) => {
  const counts = new Map<string, number>();
  products.forEach((product) => {
    const key = product.category;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return categories.map((category) => ({
    ...category,
    count: counts.get(category.id) ?? 0,
  }));
};

export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('external_id,name,description,image_url,sort_order,alternative_title,parent_ref_id')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to load categories', error.message);
    return [];
  }

  return (data as CategoryRow[] | null ?? []).map(mapCategory);
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .select('external_id,name,description,image_url,sort_order,alternative_title,parent_ref_id')
    .eq('external_id', id)
    .single();

  if (error) {
    return null;
  }

  return mapCategory(data as CategoryRow, 0);
};

export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('external_id,name,description,price,image_url,category_external_id,category_name,unit,in_stock,active,current_stock,tax_rate')
    .eq('active', true);

  if (error) {
    console.error('Failed to load products', error.message);
    return [];
  }

  return (data as ProductRow[] | null ?? []).map(mapProduct);
};

export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('external_id,name,description,price,image_url,category_external_id,category_name,unit,in_stock,active,current_stock,tax_rate')
    .eq('category_external_id', categoryId)
    .eq('active', true);

  if (error) {
    console.error('Failed to load category products', error.message);
    return [];
  }

  return (data as ProductRow[] | null ?? []).map(mapProduct);
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('external_id,name,description,price,image_url,category_external_id,category_name,unit,in_stock,active,current_stock,tax_rate')
    .eq('external_id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapProduct(data as ProductRow);
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  const q = query.trim();
  if (!q) return [];

  const { data, error } = await supabase
    .from('products')
    .select('external_id,name,description,price,image_url,category_external_id,category_name,unit,in_stock,active,current_stock,tax_rate')
    .eq('active', true)
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`);

  if (error) {
    console.error('Search failed', error.message);
    return [];
  }

  return (data as ProductRow[] | null ?? []).map(mapProduct);
};
