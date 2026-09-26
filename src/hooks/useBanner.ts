import { useState, useEffect } from 'react';

interface Banner {
  page: string;
  title: string;
  description: string;
  imageUrl: string;
}

export function useBanner(page: string) {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hamyar_banners');
    if (saved) {
      const banners: Banner[] = JSON.parse(saved);
      const pageBanner = banners.find(b => b.page === page);
      if (pageBanner) {
        setBanner(pageBanner);
      }
    }
  }, [page]);

  return banner;
}
