-- Update image URLs from proxy to relative paths for all tables
-- Run this in Supabase SQL Editor

-- 1. products table
UPDATE products
SET image = regexp_replace(image, '^https?://[^/]+/images/', '')
WHERE image LIKE 'https://hamyar.pardismms.workers.dev/images/%';

-- 2. media_items table
UPDATE media_items
SET image = regexp_replace(image, '^https?://[^/]+/images/', '')
WHERE image LIKE 'https://hamyar.pardismms.workers.dev/images/%';

-- 3. portfolio table
UPDATE portfolio
SET image = regexp_replace(image, '^https?://[^/]+/images/', '')
WHERE image LIKE 'https://hamyar.pardismms.workers.dev/images/%';

-- 4. news table
UPDATE news
SET image = regexp_replace(image, '^https?://[^/]+/images/', '')
WHERE image LIKE 'https://hamyar.pardismms.workers.dev/images/%';

-- 5. about_content table (JSONB content) - image field
UPDATE about_content
SET content = jsonb_set(
  content,
  '{image}',
  to_jsonb(regexp_replace(content->>'image', '^https?://[^/]+/images/', ''))
)
WHERE content ? 'image'
  AND content->>'image' LIKE 'https://hamyar.pardismms.workers.dev/images/%';

-- licenseImage
UPDATE about_content
SET content = jsonb_set(
  content,
  '{licenseImage}',
  to_jsonb(regexp_replace(content->>'licenseImage', '^https?://[^/]+/images/', ''))
)
WHERE content ? 'licenseImage'
  AND content->>'licenseImage' LIKE 'https://hamyar.pardismms.workers.dev/images/%';

-- trustVideo
UPDATE about_content
SET content = jsonb_set(
  content,
  '{trustVideo}',
  to_jsonb(regexp_replace(content->>'trustVideo', '^https?://[^/]+/images/', ''))
)
WHERE content ? 'trustVideo'
  AND content->>'trustVideo' LIKE 'https://hamyar.pardismms.workers.dev/images/%';

-- logo
UPDATE about_content
SET content = jsonb_set(
  content,
  '{logo}',
  to_jsonb(regexp_replace(content->>'logo', '^https?://[^/]+/images/', ''))
)
WHERE content ? 'logo'
  AND content->>'logo' LIKE 'https://hamyar.pardismms.workers.dev/images/%';

-- trustImages array - only update rows that have the proxy URL
UPDATE about_content
SET content = jsonb_set(
  content,
  '{trustImages}',
  COALESCE((
    SELECT jsonb_agg(
      CASE 
        WHEN elem LIKE '%hamyar.pardismms.workers.dev/images/%'
        THEN to_jsonb(regexp_replace(elem, '^https?://[^/]+/images/', ''))
        ELSE to_jsonb(elem)
      END
    )
    FROM jsonb_array_elements_text(content->'trustImages') AS elem
  ), '[]'::jsonb)
)
WHERE content ? 'trustImages'
  AND content->'trustImages' IS NOT NULL
  AND jsonb_typeof(content->'trustImages') = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(content->'trustImages') AS elem
    WHERE elem LIKE '%hamyar.pardismms.workers.dev/images/%'
  );

-- socialMedia array - update icon field
UPDATE about_content
SET content = jsonb_set(
  content,
  '{socialMedia}',
  COALESCE((
    SELECT jsonb_agg(
      CASE 
        WHEN item ? 'icon' AND item->>'icon' LIKE '%hamyar.pardismms.workers.dev/images/%'
        THEN jsonb_set(item, '{icon}', to_jsonb(regexp_replace(item->>'icon', '^https?://[^/]+/images/', '')))
        ELSE item
      END
    )
    FROM jsonb_array_elements(content->'socialMedia') AS item
  ), '[]'::jsonb)
)
WHERE content ? 'socialMedia'
  AND content->'socialMedia' IS NOT NULL
  AND jsonb_typeof(content->'socialMedia') = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(content->'socialMedia') AS item
    WHERE item ? 'icon' AND item->>'icon' LIKE '%hamyar.pardismms.workers.dev/images/%'
  );

-- 6. site_settings table (JSONB value) - imageUrl
UPDATE site_settings
SET value = jsonb_set(
  value,
  '{imageUrl}',
  to_jsonb(regexp_replace(value->>'imageUrl', '^https?://[^/]+/images/', ''))
)
WHERE value ? 'imageUrl'
  AND value->>'imageUrl' LIKE 'https://hamyar.pardismms.workers.dev/images/%';

-- image field
UPDATE site_settings
SET value = jsonb_set(
  value,
  '{image}',
  to_jsonb(regexp_replace(value->>'image', '^https?://[^/]+/images/', ''))
)
WHERE value ? 'image'
  AND value->>'image' LIKE 'https://hamyar.pardismms.workers.dev/images/%';

-- Verify changes
SELECT 'products' as table_name, count(*) as updated FROM products WHERE image !~ '^https?://' AND image != ''
UNION ALL
SELECT 'media_items', count(*) FROM media_items WHERE image !~ '^https?://' AND image != ''
UNION ALL
SELECT 'portfolio', count(*) FROM portfolio WHERE image !~ '^https?://' AND image != ''
UNION ALL
SELECT 'news', count(*) FROM news WHERE image !~ '^https?://' AND image != '';