/**
 * تبدیل سادهٔ Markdown به HTML برای متن مقالات.
 *
 * چرا Markdown و نه ادیتور WYSIWYG: نوشتن مقاله با Markdown ساده‌تر است، خروجی
 * HTML تمیز و سئوپسند دارد و نیازی به کتابخانهٔ سنگین ادیتور نیست. این پیاده‌سازی
 * فقط زیرمجموعهٔ پرکاربرد را پوشش می‌دهد: تیترها، بولد/ایتالیک، لینک، تصویر،
 * لیست، نقل‌قول، کد کوتاه و پاراگراف.
 *
 * امنیت: ابتدا کل متن HTML-escape می‌شود، بعد نشانه‌گذاری‌ها اعمال می‌شوند؛ پس
 * تزریق HTML از سمت نویسنده ممکن نیست.
 */

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(text: string): string {
  let out = escapeHtml(text);
  // لینک‌ها [متن](آدرس)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) => {
    const safe = /^(https?:|mailto:|\/)/i.test(href) ? href : '#';
    return `<a href="${safe}" class="text-blue-600 hover:underline" target="${safe.startsWith('http') ? '_blank' : '_self'}" rel="noopener noreferrer">${label}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  out = out.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-sm">$1</code>');
  return out;
}

export function renderMarkdown(markdown: string): string {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const html: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let paragraph: string[] = [];
  let inCode = false;
  let codeBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p class="leading-8 mb-4">${inline(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith('```')) {
      if (inCode) {
        html.push(`<pre class="p-3 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-x-auto text-sm mb-4" dir="ltr"><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
        codeBuffer = [];
        inCode = false;
      } else {
        flushParagraph();
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(raw);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = Math.min(6, heading[1].length + 1); // h1 رزرو شده برای عنوان صفحه
      const cls = level === 2 ? 'text-2xl font-bold mt-8 mb-3' : level === 3 ? 'text-xl font-bold mt-6 mb-2' : 'text-lg font-bold mt-5 mb-2';
      html.push(`<h${level} class="${cls}">${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph();
      closeList();
      html.push(`<blockquote class="border-r-4 border-blue-500 pr-4 my-4 text-gray-600 dark:text-slate-300">${inline(line.replace(/^>\s?/, ''))}</blockquote>`);
      continue;
    }

    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      flushParagraph();
      const want = ul ? 'ul' : 'ol';
      if (listType !== want) {
        closeList();
        listType = want;
        html.push(`<${want} class="${want === 'ul' ? 'list-disc' : 'list-decimal'} pr-6 space-y-1 mb-4">`);
      }
      html.push(`<li>${inline((ul || ol)![1])}</li>`);
      continue;
    }

    const img = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img) {
      flushParagraph();
      closeList();
      html.push(`<img src="${escapeHtml(img[2])}" alt="${escapeHtml(img[1])}" class="rounded-xl my-4 w-full" loading="lazy" />`);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  return html.join('\n');
}

/** متن ساده از Markdown برای خلاصه/متای سئو. */
export function markdownToPlain(markdown: string, limit = 160): string {
  const text = String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
}
