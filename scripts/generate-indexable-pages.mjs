// Generate crawlable GitHub Pages entry documents for the exact public URLs in sitemap.xml.
// A single 404.html SPA fallback serves deep links with HTTP 404 on GitHub Pages,
// which prevents reliable Google indexing of those URLs.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const site = 'https://draliwellness.com';
const dist = 'dist';
const sitemap = readFileSync('public/sitemap.xml', 'utf8');
const xmlUrls = [...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((match) => match[1].trim());
const routeMeta = {
  '/': {
    title: 'Dr. Ali Hassan Health & Wellness | BrainAxis Supplements',
    description: 'Explore BrainAxis supplements and wellness information from Dr. Ali Hassan Health & Wellness in Pakistan.',
  },
  '/shop': {
    title: 'Shop BrainAxis Supplements | Dr. Ali Hassan Health & Wellness',
    description: 'Explore BrainAxis Energy Boost multivitamins and SUNDEX-D Vitamin D3 from Dr. Ali Hassan Health & Wellness.',
  },
  '/product/brainaxis-energy-boost': {
    title: 'BrainAxis Energy Boost Multivitamin | Dr. Ali Hassan Health & Wellness',
    description: 'Discover BrainAxis Energy Boost, a premium multivitamin and mineral formula with 30 tablets. Read product information and label details.',
  },
  '/product/brainaxis-sundex-d': {
    title: 'BrainAxis SUNDEX-D Vitamin D3 200,000 IU | Dr. Ali Hassan Health & Wellness',
    description: 'Learn about BrainAxis SUNDEX-D, a high-dose Vitamin D3 200,000 IU softgel. Follow medical guidance for appropriate use.',
  },
  '/about': {
    title: 'About Dr. Ali Hassan Health & Wellness | BrainAxis',
    description: 'Meet Dr. Muhammad Ali Hassan and learn about the BrainAxis approach to wellness and supplement information.',
  },
  '/services': {
    title: 'Services | Dr. Ali Hassan Health & Wellness',
    description: 'Explore the services and wellness information available from Dr. Ali Hassan Health & Wellness.',
  },
  '/contact': {
    title: 'Contact Dr. Ali Hassan Health & Wellness',
    description: 'Get in touch with Dr. Ali Hassan Health & Wellness about BrainAxis products, orders, and customer support.',
  },
  '/faq': {
    title: 'Frequently Asked Questions | Dr. Ali Hassan Health & Wellness',
    description: 'Find answers to frequently asked questions about BrainAxis products, ordering, shipping and Dr. Ali Hassan Health & Wellness.',
  },
};

const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const replaceMeta = (html, nameOrProperty, value, isProperty = false) => {
  const attr = isProperty ? 'property' : 'name';
  const expr = new RegExp('<meta\\s+' + attr + '="' + nameOrProperty + '"[\\s\\S]*?\\/?>', 'i');
  const replacement = '<meta ' + attr + '="' + nameOrProperty + '" content="' + escapeHtml(value) + '" />';
  if (!expr.test(html)) throw new Error('Missing metadata tag: ' + nameOrProperty);
  return html.replace(expr, replacement);
};
const baseHtml = readFileSync(join(dist, 'index.html'), 'utf8');
if (!baseHtml.includes('</head>')) throw new Error('Missing </head> in built HTML');
const unique = new Set();
for (const url of xmlUrls) {
  const parsed = new URL(url);
  if (parsed.origin !== site || parsed.search || parsed.hash) throw new Error('Invalid sitemap URL: ' + url);
  const path = parsed.pathname.replace(/\/+$/, '') || '/';
  if (unique.has(path)) throw new Error('Duplicate sitemap path: ' + path);
  unique.add(path);
  if (!Object.prototype.hasOwnProperty.call(routeMeta, path)) throw new Error('Missing SEO metadata: ' + path);
  const canonical = site + (path === '/' ? '/' : path + '/');
  let html = baseHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(routeMeta[path].title) + '</title>');
  html = replaceMeta(html, 'description', routeMeta[path].description);
  html = replaceMeta(html, 'og:title', routeMeta[path].title, true);
  html = replaceMeta(html, 'og:description', routeMeta[path].description, true);
  html = html.replace('</head>', '    <link rel="canonical" href="' + canonical + '" />\n    <meta property="og:url" content="' + canonical + '" />\n  </head>');
  const dest = path === '/' ? join(dist, 'index.html') : join(dist, path.slice(1), 'index.html');
  const dir = dest.slice(0, dest.lastIndexOf('/'));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(dest, html, 'utf8');
  console.log('Indexable URL:', canonical, '=>', dest);
}
if (unique.size !== xmlUrls.length || unique.size < 8) throw new Error('Expected eight indexable sitemap pages');
