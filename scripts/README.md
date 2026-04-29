# Dubai Menu Import

This script downloads the Dubai menu payload and generates CSV files for import into Supabase.

## Outputs

- `data/imports/dubai-menu.json` - raw payload
- `data/imports/dubai-categories.csv` - category list
- `data/imports/dubai-products.csv` - product list

## Run

```bash
npm run import:dubai
```

## Supabase Import (recommended)

1. Create a `categories` table that includes at least:
   - `external_id` (text, unique)
   - `name` (text)
   - `description` (text)
   - `image_url` (text)
   - `sort_order` (integer)
2. Import `dubai-categories.csv` using Supabase Table Editor → Import.
3. Create a `products` table that includes at least:
   - `external_id` (text, unique)
   - `name` (text)
   - `description` (text)
   - `price` (numeric)
   - `image_url` (text)
   - `category_external_id` (text)
   - `category_name` (text)
   - `unit` (text)
   - `in_stock` (boolean)
   - `active` (boolean)
   - `current_stock` (integer)
   - `tax_name` (text)
   - `tax_rate` (numeric)
4. Import `dubai-products.csv` into the `products` table.

## Notes

- The endpoint is public. If it changes, update `ENDPOINT` in `scripts/import-dubai-menu.mjs`.
- If you want to map into your existing schema, keep `external_id` for reference and map to your own category IDs.
