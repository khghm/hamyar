import fs from 'fs';

const path = 'src/state/catalogStore.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace all image URLs in initialMedia with empty string
content = content.replace(
  /const initialMedia: MediaItem\[\] = \[([\s\S]*?)\];/,
  (match) => {
    return match.replace(/image:\s*['\"](https?:\/\/[^'\"]+|[^'\"]+)['\"]/g, "image: ''");
  }
);

// Also fix initialServices if it has images, initialNews, initialPortfolio, etc.
// Replace all remaining external URLs in image fields
content = content.replace(/image:\s*['\"](https?:\/\/[^'\"]+)['\"]/g, "image: ''");

fs.writeFileSync(path, content);
console.log('Done: all image URLs cleared');