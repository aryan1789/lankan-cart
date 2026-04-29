import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const ENV_PATH = resolve('.env.local');
const INPUT_DIR = resolve('data', 'imports');

dotenv.config({ path: ENV_PATH });

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (recommended) or VITE_SUPABASE_KEY in .env.local.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const parseCsv = (content) => {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  const pushCell = () => {
    row.push(current);
    current = '';
  };

  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === ',' || char === '\n')) {
      pushCell();
      if (char === '\n') {
        pushRow();
      }
      continue;
    }

    if (char === '\r') {
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    pushCell();
    pushRow();
  }

  const [header, ...data] = rows;
  return data
    .filter((r) => r.some((cell) => cell !== ''))
    .map((r) => Object.fromEntries(header.map((key, idx) => [key, r[idx] ?? ''])));
};

const chunk = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const upsertInBatches = async (table, rows, conflictKey) => {
  const batches = chunk(rows, 200);
  for (const batch of batches) {
    const { error } = await supabase.from(table).upsert(batch, { onConflict: conflictKey });
    if (error) {
      throw error;
    }
  }
};

const run = async () => {
  const categoriesCsv = await readFile(resolve(INPUT_DIR, 'dubai-categories.csv'), 'utf-8');
  const productsCsv = await readFile(resolve(INPUT_DIR, 'dubai-products.csv'), 'utf-8');

  const categories = parseCsv(categoriesCsv).map((row) => ({
    external_id: row.external_id,
    name: row.name,
    description: row.description || null,
    image_url: row.image_url || null,
    sort_order: row.sort_order ? Number(row.sort_order) : null,
    alternative_title: row.alternative_title || null,
    parent_ref_id: row.parent_ref_id ? Number(row.parent_ref_id) : null,
  }));

  const products = parseCsv(productsCsv).map((row) => ({
    external_id: row.external_id,
    name: row.name,
    description: row.description || null,
    price: row.price ? Number(row.price) : null,
    image_url: row.image_url || null,
    category_external_id: row.category_external_id || null,
    category_name: row.category_name || null,
    unit: row.unit || null,
    in_stock: row.in_stock === 'true',
    active: row.active === 'true',
    current_stock: row.current_stock ? Number(row.current_stock) : 0,
    tax_name: row.tax_name || null,
    tax_rate: row.tax_rate ? Number(row.tax_rate) : null,
  }));

  console.log(`Importing ${categories.length} categories...`);
  await upsertInBatches('categories', categories, 'external_id');
  console.log(`Importing ${products.length} products...`);
  await upsertInBatches('products', products, 'external_id');

  console.log('Import complete.');
};

run().catch((error) => {
  console.error('Import failed:', error.message);
  process.exit(1);
});
