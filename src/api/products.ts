import type { Product } from '../store';
import { fetchCollection, syncCollection, type CollectionMapper } from './sync';

/**
 * Store `Product` <-> `products` table. The store id is the `sku` business key
 * (`p1`, `p2`, …) so every existing page keeps resolving products by that id.
 */
export const productMapper: CollectionMapper<Product> = {
  table: 'products',
  keyColumn: 'sku',
  toRow: (p) => ({
    sku: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: Math.round(p.price),
    original_price: p.originalPrice != null ? Math.round(p.originalPrice) : null,
    stock: Math.round(p.stock),
    image: p.image || null,
    description: p.description,
    barcode: p.barcode ?? null,
    warranty: p.warranty ?? null,
    alert_threshold: p.alertThreshold ?? null,
    last_restocked: p.lastRestocked ?? null,
    supplier: p.supplier ?? null,
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    name: r.name,
    brand: r.brand ?? '',
    category: r.category ?? '',
    price: Number(r.price) || 0,
    originalPrice: r.original_price != null ? Number(r.original_price) : undefined,
    stock: Number(r.stock) || 0,
    image: r.image ?? '',
    description: r.description ?? '',
    barcode: r.barcode ?? undefined,
    warranty: r.warranty ?? undefined,
    alertThreshold: r.alert_threshold ?? undefined,
    lastRestocked: r.last_restocked ?? undefined,
    supplier: r.supplier ?? undefined,
  }),
};

export const fetchProducts = () => fetchCollection(productMapper);
export const syncProducts = (next: Product[], previous: Product[]) =>
  syncCollection(productMapper, next, previous);
