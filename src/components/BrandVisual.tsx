import React from 'react';

type BrandIcon = React.ComponentType<{ size?: number | string; className?: string }>;

/**
 * تصویر جایگزین برند برای کارت‌هایی که تصویر ندارند.
 *
 * به‌جای کارت خالی/سفید، یک پوشش گرادیانی با آیکون موضوعی نشان می‌دهد؛ رنگ از
 * روی متن (seed) انتخاب می‌شود تا کارت‌ها یکنواخت نباشند.
 */
export default function BrandVisual({
  seed = '',
  icon: Icon,
  className = '',
  iconSize = 40,
}: {
  seed?: string;
  icon: BrandIcon;
  className?: string;
  iconSize?: number;
}) {
  const palettes = [
    'from-blue-600 to-indigo-800',
    'from-indigo-600 to-purple-800',
    'from-sky-500 to-blue-800',
    'from-violet-600 to-fuchsia-800',
    'from-cyan-600 to-blue-800',
  ];
  const code = [...String(seed)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const palette = palettes[code % palettes.length];

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${palette} ${className}`}>
      <div
        className="absolute inset-0 opacity-25"
        style={{ backgroundImage: 'radial-gradient(circle at 25% 20%, #ffffff 0, transparent 45%)' }}
      />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <Icon size={iconSize} className="relative text-white/85" />
    </div>
  );
}
