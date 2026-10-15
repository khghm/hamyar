UPDATE products SET image = '';
UPDATE media_items SET image = '';
UPDATE portfolio SET image = '';
UPDATE news SET image = '';

-- about_content JSONB fields
UPDATE about_content 
SET content = jsonb_set(content, '{image}', '""'::jsonb)
WHERE content ? 'image';

UPDATE about_content 
SET content = jsonb_set(content, '{licenseImage}', '""'::jsonb)
WHERE content ? 'licenseImage';

UPDATE about_content 
SET content = jsonb_set(content, '{trustVideo}', '""'::jsonb)
WHERE content ? 'trustVideo';

UPDATE about_content 
SET content = jsonb_set(content, '{logo}', '""'::jsonb)
WHERE content ? 'logo';

UPDATE about_content 
SET content = jsonb_set(content, '{trustImages}', '[]'::jsonb)
WHERE content ? 'trustImages';

-- site_settings JSONB fields
UPDATE site_settings 
SET value = jsonb_set(value, '{imageUrl}', '""'::jsonb)
WHERE value ? 'imageUrl';

UPDATE site_settings 
SET value = jsonb_set(value, '{image}', '""'::jsonb)
WHERE value ? 'image';