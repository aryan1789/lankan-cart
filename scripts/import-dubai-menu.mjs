import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const ENDPOINT = 'https://api.tmbill.com/digimenu/tmdigi-menu/api/menu/26152';
const OUTPUT_DIR = resolve('data', 'imports');

const headers = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
  origin: 'https://order.lankancart.ae',
  referer: 'https://order.lankancart.ae/',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const pickImage = (item) => {
  return (
    item?.image ||
    item?.assets?.images?.digital ||
    item?.assets?.images?.pos ||
    item?.assets?.images?.kiosk ||
    ''
  );
};

const toBool = (value) => (value ? 'true' : 'false');

const run = async () => {
  const response = await fetch(ENDPOINT, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch menu: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const categories = payload?.storeCategories ?? [];
  const items = payload?.storeMenuItems ?? [];

  await mkdir(OUTPUT_DIR, { recursive: true });

  await writeFile(
    resolve(OUTPUT_DIR, 'dubai-menu.json'),
    JSON.stringify(payload, null, 2),
    'utf-8'
  );

  const categoryRows = [
    [
      'external_id',
      'name',
      'description',
      'image_url',
      'sort_order',
      'alternative_title',
      'parent_ref_id',
    ],
    ...categories.map((category) => [
      category.category_refid,
      category.category_name,
      category.description ?? '',
      category.img_url ?? '',
      category.category_sort ?? '',
      category.alternative_title ?? '',
      category.parent_ref_id ?? '',
    ]),
  ];

  const productRows = [
    [
      'external_id',
      'name',
      'description',
      'price',
      'image_url',
      'category_external_id',
      'category_name',
      'unit',
      'in_stock',
      'active',
      'current_stock',
      'tax_name',
      'tax_rate',
    ],
    ...items.map((item) => {
      const categoryRef = String(item.category_ref_ids ?? '').split(',')[0].trim();
      return [
        item.item_id ?? item.menu_childid ?? '',
        item.title ?? '',
        item.description ?? '',
        item.sale_price ?? item.sale_price_new ?? '',
        pickImage(item),
        categoryRef,
        item.category_name ?? '',
        item?.extra_details?.unit_name ?? '',
        toBool((item.current_stock ?? 0) > 0),
        toBool(item.active === 1),
        item.current_stock ?? 0,
        item.tax_name ?? '',
        item.tax_per ?? '',
      ];
    }),
  ];

  const toCsv = (rows) => rows.map((row) => row.map(escapeCsv).join(',')).join('\n');

  await writeFile(resolve(OUTPUT_DIR, 'dubai-categories.csv'), toCsv(categoryRows), 'utf-8');
  await writeFile(resolve(OUTPUT_DIR, 'dubai-products.csv'), toCsv(productRows), 'utf-8');

  console.log(`Saved ${categories.length} categories and ${items.length} products to ${OUTPUT_DIR}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
