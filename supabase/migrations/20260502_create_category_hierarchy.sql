-- Insert parent categories
INSERT INTO public.categories (external_id, name, parent_ref_id, sort_order) VALUES
  (100, 'Fresh Produce', NULL, 1),
  (101, 'Grains & Flour', NULL, 2),
  (102, 'Pantry Staples', NULL, 3),
  (103, 'Spreads & Condiments', NULL, 4),
  (104, 'Sweets & Treats', NULL, 5),
  (105, 'Beverages', NULL, 6),
  (106, 'Dairy & Powders', NULL, 7),
  (107, 'Bakery Items', NULL, 8),
  (108, 'Personal Care', NULL, 9),
  (109, 'Health & Wellness', NULL, 10),
  (110, 'Baby Products', NULL, 11),
  (111, 'Snacks', NULL, 12),
  (112, 'Specialty Products', NULL, 13),
  (113, 'Home & Kitchen', NULL, 14),
  (114, 'Patriotic Items', NULL, 15)
ON CONFLICT (external_id) DO NOTHING;

-- Update existing categories to link to parents
-- Fresh Produce children
UPDATE public.categories SET parent_ref_id = 100 WHERE name IN ('Fruit', 'Leafy Vegetables', 'Vegetable');

-- Grains & Flour children
UPDATE public.categories SET parent_ref_id = 101 WHERE name IN ('Rice', 'Flour & Grains');

-- Pantry Staples children
UPDATE public.categories SET parent_ref_id = 102 WHERE name IN ('Dry & Canned Foods', 'Noodles', 'Side Dish');

-- Spreads & Condiments children
UPDATE public.categories SET parent_ref_id = 103 WHERE name IN ('Pickles & Chutneys', 'Sauces & Dressings', 'Syrups & Honey', 'Jam', 'Spreads');

-- Sweets & Treats children
UPDATE public.categories SET parent_ref_id = 104 WHERE name IN ('Chocolate', 'Ice Cream & Desserts');

-- Beverages children
UPDATE public.categories SET parent_ref_id = 105 WHERE name = 'Beverages';

-- Dairy & Powders children
UPDATE public.categories SET parent_ref_id = 106 WHERE name = 'Milk Powder';

-- Bakery Items children (self-parent for single item)
UPDATE public.categories SET parent_ref_id = 107 WHERE name = 'Bakery Items';

-- Personal Care children
UPDATE public.categories SET parent_ref_id = 108 WHERE name = 'Personal Care';

-- Health & Wellness children
UPDATE public.categories SET parent_ref_id = 109 WHERE name = 'Ayurvedic';

-- Baby Products children
UPDATE public.categories SET parent_ref_id = 110 WHERE name = 'Baby Items';

-- Snacks children
UPDATE public.categories SET parent_ref_id = 111 WHERE name = 'Snacks Items';

-- Specialty Products children
UPDATE public.categories SET parent_ref_id = 112 WHERE name IN ('Soya Meat', 'Coconut Products');

-- Home & Kitchen children
UPDATE public.categories SET parent_ref_id = 113 WHERE name = 'Kitchen Items';

-- Patriotic Items children
UPDATE public.categories SET parent_ref_id = 114 WHERE name = 'Patriotic Items';
