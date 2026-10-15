import type { MediaItem } from '../store';
import { fetchCollection, syncCollection, type CollectionMapper } from './sync';

/** Store `MediaItem` <-> `media_items` (business key in `sku`, e.g. `m1`). */
export const mediaMapper: CollectionMapper<MediaItem> = {
  table: 'media_items',
  keyColumn: 'sku',
  toRow: (m) => ({
    sku: m.id,
    title: m.title,
    year: m.year ?? null,
    genre: m.genre ?? [],
    type: m.type,
    quality: m.quality ?? null,
    language: m.language ?? null,
    subtitle: m.subtitle ?? null,
    volume: m.volume ?? null,
    rating: m.rating ?? null,
    image: m.image || null,
    description: m.description ?? null,
    director: m.director ?? null,
    country: m.country ?? null,
    imdb: m.imdb ?? null,
    price: m.price ?? 0,
  }),
  fromRow: (r) => ({
    id: r.sku ?? r.id,
    title: r.title,
    year: Number(r.year) || 0,
    genre: r.genre ?? [],
    type: r.type,
    quality: r.quality ?? '',
    language: r.language ?? '',
    subtitle: r.subtitle ?? '',
    volume: r.volume ?? '',
    rating: Number(r.rating) || 0,
    image: r.image ?? '',
    description: r.description ?? '',
    director: r.director ?? undefined,
    country: r.country ?? undefined,
    imdb: r.imdb != null ? Number(r.imdb) : undefined,
    price: Number(r.price) || 0,
  }),
};

export const fetchMediaItems = () => fetchCollection(mediaMapper);
export const syncMediaItems = (next: MediaItem[], previous: MediaItem[]) =>
  syncCollection(mediaMapper, next, previous);
