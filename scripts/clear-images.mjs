import fs from 'fs';

const path = 'src/state/catalogStore.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace all image URLs in initialProducts with empty string
content = content.replace(
  /const initialProducts: Product\[\] = \[([\s\S]*?)\];/,
  (match) => {
    return match.replace(/image:\s*['\"](https?:\/\/[^'\"]+|[^'\"]+)['\"]/g, "image: ''");
  }
);

fs.writeFileSync(path, content);
console.log('Done: initialProducts image URLs cleared');