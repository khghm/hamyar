import fs from 'fs';
const src = 'D:\\Works\\hamyar\\src\\domains\\types.ts';
let content = fs.readFileSync(src, 'utf8');
const lines = content.split('\n');
console.log('Original lines:', lines.length);

const part1 = lines.slice(0, 1606); // lines 1-1606 (0-indexed: 0-1605)
const part2 = lines.slice(1669, 1777); // lines 1670-1777 (0-indexed: 1669-1776)
const part3 = lines.slice(1792, 1814); // lines 1793-1814 (0-indexed: 1792-1813)

const importLine = "import { normalizeHex, badgeStyle } from '../utils/color';";

const result = [
  part1[0],
  importLine,
  ...part1.slice(1),
  ...part2,
  ...part3,
].join('\n');

fs.writeFileSync(src, result, 'utf8');
console.log('New lines:', result.split('\n').length);
console.log('Done.');
