import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockReturnThis(),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

vi.mock('../api/products', () => ({
  fetchProducts: vi.fn().mockResolvedValue([
    { id: 'p1', name: 'Server Product', brand: 'Test', category: 'test', price: 100, originalPrice: 0, stock: 10, image: '', description: '', barcode: '', warranty: '', alertThreshold: 0, lastRestocked: '', supplier: '' },
  ]),
  syncProducts: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../api/media', () => ({
  fetchMediaItems: vi.fn().mockResolvedValue([]),
  syncMediaItems: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../api/services', () => ({
  fetchServices: vi.fn().mockResolvedValue([]),
  syncServices: vi.fn().mockResolvedValue({ success: true }),
  fetchPortfolio: vi.fn().mockResolvedValue([]),
  syncPortfolio: vi.fn().mockResolvedValue({ success: true }),
  fetchNews: vi.fn().mockResolvedValue([]),
  syncNews: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../domains/projects/api', () => ({
  fetchProjects: vi.fn().mockResolvedValue([]),
  syncProjects: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../api/sync', () => ({
  onSyncError: vi.fn(),
}));

import { useCatalogStore } from '../state/catalogStore';
import { fetchProducts } from '../api/products';
import type { Product, MediaItem, Service, AboutContent } from '../domains/types';

const createTestProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Test Product',
  brand: 'Test Brand',
  category: 'test',
  price: 100,
  originalPrice: 0,
  stock: 10,
  image: '',
  description: '',
  barcode: '',
  warranty: '',
  alertThreshold: 0,
  lastRestocked: '',
  supplier: '',
  ...overrides,
});

const createTestMedia = (overrides: Partial<MediaItem> = {}): MediaItem => ({
  id: 'm1',
  title: 'Test Movie',
  year: 2023,
  genre: ['test'],
  type: 'movie',
  quality: 'HD',
  language: 'English',
  subtitle: 'Persian',
  volume: '1GB',
  rating: 8.0,
  image: '',
  description: '',
  ...overrides,
});

const createTestService = (overrides: Partial<Service> = {}): Service => ({
  id: 's1',
  name: 'Test Service',
  category: 'design',
  basePrice: 500,
  unit: 'project',
  description: '',
  active: true,
  fields: [],
  docs: [],
  ...overrides,
});

const createTestAbout = (overrides: Partial<AboutContent> = {}): AboutContent => ({
  description: 'Test',
  licenseImage: '',
  trustImages: [],
  trustVideo: '',
  mission: '',
  vision: '',
  logo: '',
  socialMedia: [],
  ...overrides,
});

describe('catalogStore - actions + hydrate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
    useCatalogStore.setState({
      products: [],
      mediaItems: [],
      services: [],
      news: [],
      portfolio: [],
      projects: [],
      aboutContent: createTestAbout(),
      hydrated: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('setProducts updates state', () => {
    const newProducts = [createTestProduct({ id: 'p1', name: 'Test Product' })];

    act(() => {
      useCatalogStore.getState().setProducts(newProducts);
    });

    expect(useCatalogStore.getState().products).toEqual(newProducts);
  });

  it('setMediaItems updates state', () => {
    const newMedia = [createTestMedia({ id: 'm1', title: 'Test Movie' })];

    act(() => {
      useCatalogStore.getState().setMediaItems(newMedia);
    });

    expect(useCatalogStore.getState().mediaItems).toEqual(newMedia);
  });

  it('setServices updates state', () => {
    const newServices = [createTestService({ id: 's1', name: 'Test Service', basePrice: 500 })];

    act(() => {
      useCatalogStore.getState().setServices(newServices);
    });

    expect(useCatalogStore.getState().services).toEqual(newServices);
  });

  it('hydrate fetches from Supabase and updates state', async () => {
    await act(async () => {
      await useCatalogStore.getState().hydrate();
    });

    expect(fetchProducts).toHaveBeenCalled();
    expect(useCatalogStore.getState().hydrated).toBe(true);
    expect(useCatalogStore.getState().products.length).toBeGreaterThan(0);
  });

  it('addProduct adds to existing products', () => {
    const initialProducts = [createTestProduct({ id: 'p1', name: 'Product 1' })];

    act(() => {
      useCatalogStore.getState().setProducts(initialProducts);
    });

    const newProduct = createTestProduct({ id: 'p2', name: 'Product 2' });

    act(() => {
      useCatalogStore.getState().addProduct(newProduct);
    });

    expect(useCatalogStore.getState().products).toHaveLength(2);
    expect(useCatalogStore.getState().products[1]).toEqual(newProduct);
  });

  it('updateProduct updates existing product', () => {
    const initialProducts = [createTestProduct({ id: 'p1', name: 'Product 1', price: 100, stock: 10 })];

    act(() => {
      useCatalogStore.getState().setProducts(initialProducts);
    });

    act(() => {
      useCatalogStore.getState().updateProduct('p1', { price: 150, stock: 8 });
    });

    const updated = useCatalogStore.getState().products.find(p => p.id === 'p1');
    expect(updated?.price).toBe(150);
    expect(updated?.stock).toBe(8);
  });

  it('deleteProduct removes product', () => {
    const initialProducts = [
      createTestProduct({ id: 'p1', name: 'Product 1' }),
      createTestProduct({ id: 'p2', name: 'Product 2' }),
    ];

    act(() => {
      useCatalogStore.getState().setProducts(initialProducts);
    });

    act(() => {
      useCatalogStore.getState().deleteProduct('p1');
    });

    expect(useCatalogStore.getState().products).toHaveLength(1);
    expect(useCatalogStore.getState().products[0].id).toBe('p2');
  });
});