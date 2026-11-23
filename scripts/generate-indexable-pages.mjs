// Build initial, crawlable HTML for the URLs that are present in the public sitemap.
// The React app replaces the fallback with its live CMS-backed content after hydration.
// Keep these factual summaries aligned with the public storefront; do not hardcode
// live prices, stock, unverified reviews, or medical-treatment promises.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const origin = 'https://draliwellness.com';
const dist = 'dist';
const founder = 'Dr. Muhammad Ali Hassan';
const brand = 'Dr. Ali Hassan Health & Wellness';
const heroImage = origin + '/assets/aistudio/brainaxis-energyboost-hd-20261122.webp';
const energyImage = origin + '/assets/aistudio/WhatsApp_Image_2026-11-18_at_8.12.13_PM_f8e9a69a.jpeg';
const vitaminImage = origin + '/assets/aistudio/WhatsApp_Image_2026-11-20_at_9.18.00_AM_ccfe932b.jpeg';
const multivitaminSource = 'https://ods.od.nih.gov/factsheets/MVMS-Consumer/';
const vitaminSource = 'https://ods.od.nih.gov/factsheets/VitaminD-Consumer/';

const productDetails = {
  '/product/brainaxis-energy-boost': {
    name: 'BrainAxis Energy Boost',
    brand: 'BrainAxis',
    sku: 'BA-EB-30T',
    image: energyImage,
    description: 'A 30-tablet multivitamin and mineral dietary supplement. Check the full composition, label, directions and cautions before use.',
  },
  '/product/brainaxis-sundex-d': {
    name: 'BrainAxis SUNDEX-D Vitamin D3 200,000 IU',
    brand: 'BrainAxis',
    sku: 'BA-SD-200K-1S',
    image: vitaminImage,
    description: 'A high-dose vitamin D3 (cholecalciferol) 200,000 IU softgel. Use only as directed by a qualified healthcare professional; not an everyday vitamin D dose.',
  },
};

const pages = {
  '/': {
    title: 'Dr. Ali Hassan Health & Wellness | BrainAxis Pakistan',
    description: 'Explore BrainAxis Energy Boost multivitamin and SUNDEX-D high-dose vitamin D3, product labels, safety guidance and ordering in Pakistan.',
    heading: 'Dr. Ali Hassan Health & Wellness',
    intro: 'Discover the BrainAxis supplement range, read product information and safety directions, and learn about the founder and customer support.',
    image: heroImage,
    sections: [
      ['Shop BrainAxis supplements', 'Browse Energy Boost, a 30-tablet multivitamin and mineral supplement, and SUNDEX-D, a high-dose vitamin D3 softgel.', '/shop/'],
      ['Learn about the founder', 'Find the professional biography of Dr. Muhammad Ali Hassan and the vision behind BrainAxis.', '/about/'],
      ['Read product guidance', 'Review the supplement labels, precautions, and frequently asked questions before ordering.', '/faq/'],
    ],
  },
  '/shop': {
    title: 'Shop BrainAxis Supplements in Pakistan | Dr. Ali Hassan',
    description: 'Shop BrainAxis Energy Boost 30 tablets and SUNDEX-D vitamin D3 200,000 IU softgel in Pakistan. Check details and precautions before ordering.',
    heading: 'Shop BrainAxis Supplements',
    intro: 'Explore the currently listed BrainAxis products, including a daily multivitamin and a clinician-supervised high-dose vitamin D3 softgel.',
    sections: [
      ['BrainAxis Energy Boost', '30 tablets; multivitamin and mineral formula. Review its supplement facts and once-daily label directions.', '/product/brainaxis-energy-boost/'],
      ['BrainAxis SUNDEX-D', 'One 200,000 IU vitamin D3 softgel. High-dose product: medical guidance is required for safe use.', '/product/brainaxis-sundex-d/'],
    ],
  },
  '/product/brainaxis-energy-boost': {
    title: 'BrainAxis Energy Boost 30 Tablets | Multivitamin Pakistan',
    description: 'BrainAxis Energy Boost: 30-tablet multivitamin and mineral supplement. Read the label, daily-use directions, ingredients and safety information.',
    heading: 'BrainAxis Energy Boost – 30 Tablets',
    intro: 'BrainAxis Energy Boost is a multivitamin and mineral dietary supplement packaged as 30 tablets. The product label describes one tablet daily; read the full label and safety warnings.',
    image: energyImage,
    sections: [
      ['What is Energy Boost?', 'A BrainAxis multivitamin and mineral formulation for routine dietary supplementation. It is not a treatment for illness.'],
      ['How is it used?', 'The label states one tablet daily, preferably after a meal, or as directed by a healthcare professional. Do not exceed the label directions.'],
      ['Safety and product details', 'Check the actual packaging for complete ingredients, allergen information, batch and expiry information, and interactions. Ask a clinician if you take medication or are pregnant or nursing.'],
      ['Independent background information', 'Read the NIH Office of Dietary Supplements overview of multivitamin and mineral supplements.', multivitaminSource],
    ],
  },
  '/product/brainaxis-sundex-d': {
    title: 'BrainAxis SUNDEX-D Vitamin D3 200,000 IU | Pakistan',
    description: 'BrainAxis SUNDEX-D high-dose vitamin D3 200,000 IU softgel. Review precautions, product information and clinician-supervised use guidance.',
    heading: 'BrainAxis SUNDEX-D – Vitamin D3 200,000 IU',
    intro: 'SUNDEX-D contains vitamin D3 (cholecalciferol) in a 200,000 IU softgel. This is a high-dose product and is not intended for unsupervised daily use.',
    image: vitaminImage,
    sections: [
      ['What is SUNDEX-D?', 'A single high-potency vitamin D3 softgel supplied under the BrainAxis brand.'],
      ['How often should it be taken?', 'Only at the dose and interval prescribed by a qualified healthcare professional. Do not interpret 200,000 IU as a daily dose.'],
      ['Why is medical guidance important?', 'Too much vitamin D can cause harm. Discuss existing medication, health conditions and other supplements with your clinician before use.'],
      ['Independent background information', 'Read the NIH Office of Dietary Supplements consumer fact sheet on vitamin D.', vitaminSource],
    ],
  },
  '/about': {
    title: 'About Dr. Muhammad Ali Hassan | Founder of BrainAxis',
    description: 'Learn about Dr. Muhammad Ali Hassan, his medical and research background, and the mission behind Dr. Ali Hassan Health & Wellness and BrainAxis.',
    heading: 'About Dr. Muhammad Ali Hassan',
    intro: 'Dr. Muhammad Ali Hassan is a medical doctor and clinical researcher, and the founder of Dr. Ali Hassan Health & Wellness and BrainAxis.',
    image: origin + '/assets/aistudio/founder-dr-muhammad-ali-hassan.webp',
    sections: [
      ['Professional background', 'His published profile describes medical training at Shifa College of Medicine, research activities and a focus on healthcare innovation.'],
      ['Why BrainAxis?', 'The brand aims to provide clear product labeling and responsible supplement information alongside its health and wellness offering.'],
      ['Connect and learn more', 'Explore product information and links to the founder’s professional profiles on the About page.', '/shop/'],
    ],
  },
  '/services': {
    title: 'Wellness & Consultation Services | Dr. Ali Hassan',
    description: 'Explore BrainAxis wellness and supplement guidance services. Availability and appointments depend on published provider schedules.',
    heading: 'Wellness & Consultation Services',
    intro: 'Information on wellness consultations and supplement guidance. Services marked “Coming Soon” are informational; appointments require active provider scheduling.',
    sections: [
      ['Nutrition consultation', 'Details and provider availability will be published when scheduling is enabled.'],
      ['Supplement information', 'Our support resources explain product labels, directions and when to consult a healthcare professional.'],
      ['Questions?', 'Contact the support team about the availability of listed services.', '/contact/'],
    ],
  },
  '/contact': {
    title: 'Contact Dr. Ali Hassan Health & Wellness | Pakistan',
    description: 'Contact Dr. Ali Hassan Health & Wellness for BrainAxis product information, orders, delivery support and website enquiries.',
    heading: 'Contact Dr. Ali Hassan Health & Wellness',
    intro: 'Need help with BrainAxis Energy Boost, SUNDEX-D or an order? Use the contact form or official support channels on this page.',
    sections: [
      ['Product questions', 'Ask about ingredients, label instructions, ordering and delivery.'],
      ['Health questions', 'For personal medical advice, dose changes or high-dose vitamin D use, consult your own qualified healthcare professional.'],
    ],
  },
  '/faq': {
    title: 'BrainAxis FAQ | Orders, Shipping & Supplement Safety',
    description: 'Answers to common questions about BrainAxis supplements, orders, Cash on Delivery, shipping and high-dose SUNDEX-D precautions.',
    heading: 'Frequently Asked Questions',
    intro: 'Answers about ordering and using the BrainAxis storefront. Read the product label and seek professional medical advice when appropriate.',
    sections: [
      ['How can I order BrainAxis supplements?', 'Choose the product in the Shop, review its details, then proceed through the checkout flow.', '/shop/'],
      ['What is BrainAxis Energy Boost?', 'It is a 30-tablet multivitamin and mineral dietary supplement.', '/product/brainaxis-energy-boost/'],
      ['Can SUNDEX-D 200,000 IU be taken every day?', 'No daily dosing should be assumed. This high-dose vitamin D3 product should only be used according to a qualified healthcare professional’s directions.', '/product/brainaxis-sundex-d/'],
      ['Where can I get order support?', 'Use the contact form or contact options listed on the website.', '/contact/'],
    ],
  },
};

const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const jsonScript = (data) => '<script type="application/ld+json">' + JSON.stringify(data).replaceAll('<', '\\u003c') + '</script>';
const urlFor = (path) => origin + (path === '/' ? '/' : path + '/');
const absolute = (value) => value.startsWith('/') ? origin + value : value;
const orgId = origin + '/#organization';
const webId = origin + '/#website';
const founderId = origin + '/about/#founder';

const siteOrganization = {
  '@type': 'Organization',
  '@id': orgId,
  name: brand,
  url: origin + '/',
  logo: { '@type': 'ImageObject', url: origin + '/favicon-512.png' },
  image: origin + '/dr-ali-hassan-logo.png',
  founder: { '@id': founderId },
  brand: { '@type': 'Brand', name: 'BrainAxis' },
  sameAs: [
    'https://www.linkedin.com/in/dr-muhammad-ali-hassan-5174b7287/',
    'https://www.instagram.com/dr.ali.neurosurgeon/',
  ],
};
const webSite = {
  '@type': 'WebSite',
  '@id': webId,
  name: brand,
  alternateName: 'BrainAxis',
  url: origin + '/',
  publisher: { '@id': orgId },
  inLanguage: 'en-PK',
};

function breadcrumbs(path, page) {
  const crumbs = [{ name: 'Home', item: origin + '/' }];
  if (path.startsWith('/product/')) crumbs.push({ name: 'Shop', item: urlFor('/shop') });
  if (path !== '/') crumbs.push({ name: page.heading, item: urlFor(path) });
  return crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item }));
}

function schemaFor(path, page) {
  const canonical = urlFor(path);
  const graph = [
    siteOrganization, webSite,
    {
      '@type': path === '/faq' ? 'FAQPage' : 'WebPage',
      '@id': canonical + '#webpage',
      url: canonical,
      name: page.title,
      description: page.description,
      inLanguage: 'en-PK',
      isPartOf: { '@id': webId },
      about: { '@id': orgId },
    },
  ];
  if (path !== '/') {
    graph.push({
      '@type': 'BreadcrumbList', '@id': canonical + '#breadcrumbs',
      itemListElement: breadcrumbs(path, page),
    });
    graph[2].breadcrumb = { '@id': canonical + '#breadcrumbs' };
  }
  if (path === '/about') {
    graph.push({
      '@type': 'Person', '@id': founderId,
      name: founder, url: canonical,
      image: origin + '/assets/aistudio/founder-dr-muhammad-ali-hassan.webp',
      jobTitle: ['Medical Doctor', 'Founder'],
      worksFor: { '@id': orgId },
    });
    graph[2].mainEntity = { '@id': founderId };
  }
  if (Object.hasOwn(productDetails, path)) {
    const data = productDetails[path];
    const productId = canonical + '#product';
    graph.push({
      '@type': 'Product', '@id': productId,
      name: data.name, description: data.description,
      image: [data.image], sku: data.sku,
      brand: { '@type': 'Brand', name: data.brand },
      url: canonical,
    });
    graph[2].mainEntity = { '@id': productId };
  }
  if (path === '/faq') {
    graph[2].mainEntity = page.sections.map(([question, answer]) => ({
      '@type': 'Question', name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    }));
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

function fallbackContent(path, page) {
  const sections = page.sections.map(([heading, body, link]) => {
    const linkText = link ? '<p><a href="' + escapeHtml(absolute(link)) + '">' +
      (link.startsWith('/') ? 'Explore this page' : 'Read independent source') + '</a></p>' : '';
    return '<section><h2>' + escapeHtml(heading) + '</h2><p>' + escapeHtml(body) + '</p>' + linkText + '</section>';
  }).join('');
  const image = page.image ? '<img src="' + escapeHtml(page.image) + '" alt="' + escapeHtml(page.heading) +
    '" width="900" height="450" decoding="async" loading="lazy" style="width:100%;height:auto;max-height:360px;object-fit:contain"/>' : '';
  return [
    '<div style="font-family:system-ui,-apple-system,sans-serif;color:#174D40;background:#FAF8F2;min-height:100vh">',
    '<nav aria-label="Main navigation" style="padding:18px;display:flex;gap:18px;flex-wrap:wrap">',
    '<a href="/">Home</a><a href="/shop/">Shop</a><a href="/about/">About</a>',
    '<a href="/services/">Services</a><a href="/contact/">Contact</a><a href="/faq/">FAQ</a></nav>',
    '<main style="margin:0 auto;max-width:1080px;padding:16px 24px 48px">',
    '<h1>' + escapeHtml(page.heading) + '</h1>',
    '<p style="font-size:1.12rem;line-height:1.7">' + escapeHtml(page.intro) + '</p>',
    image,
    '<div style="display:grid;gap:18px;margin-top:24px">',
    sections, '</div>',
    '<p style="font-size:.9rem;line-height:1.6;margin-top:24px">',
    'Supplement information does not replace personal medical advice. Always read product labeling.</p>',
    '<p><a href="/contact/">Customer support</a> · <a href="/faq/">Frequently asked questions</a></p>',
    '</main></div>',
  ].join('');
}

const sitemap = readFileSync('public/sitemap.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((m) => m[1].trim());
const baseHtml = readFileSync(join(dist, 'index.html'), 'utf8');
if (!baseHtml.includes('<div id="root"></div>')) throw Error('React root placeholder not found');
if (!baseHtml.includes('</head>')) throw Error('Document head not found');
const visited = new Set();
for (const url of urls) {
  const parsed = new URL(url);
  const path = parsed.pathname.replace(/\/+$/, '') || '/';
  if (parsed.origin !== origin || parsed.search || parsed.hash || url !== urlFor(path)) throw Error('Invalid sitemap URL: ' + url);
  if (visited.has(path) || !Object.hasOwn(pages, path)) throw Error('Duplicate or unknown sitemap route: ' + path);
  visited.add(path);
  const data = pages[path];
  const canonical = urlFor(path);
  let html = baseHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(data.title) + '</title>');
  const descriptionTag = /<meta\s+name="description"[\s\S]*?\/>/i;
  if (!descriptionTag.test(html)) throw Error('Missing initial description tag');
  html = html.replace(descriptionTag, '<meta name="description" content="' + escapeHtml(data.description) + '" />');
  html = html.replace(/<meta\s+property="og:title"[^>]*>/i, '<meta property="og:title" content="' + escapeHtml(data.title) + '" />');
  html = html.replace(/<meta\s+property="og:description"[\s\S]*?\/>/i,
    '<meta property="og:description" content="' + escapeHtml(data.description) + '" />');
  html = html.replace(/<meta\s+name="twitter:title"[^>]*>/i,
    '<meta name="twitter:title" content="' + escapeHtml(data.title) + '" />');
  html = html.replace(/<meta\s+name="twitter:description"[\s\S]*?\/>/i,
    '<meta name="twitter:description" content="' + escapeHtml(data.description) + '" />');
  // The original template has site-level Organization markup. Replace it with
  // one connected @graph, rather than publishing contradictory duplicate entities.
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, '');
  const socialImage = data.image || heroImage;
  html = html.replace('</head>', [
    '    <link rel="canonical" href="' + canonical + '" />',
    '    <meta property="og:url" content="' + canonical + '" />',
    '    <meta property="og:image" content="' + escapeHtml(socialImage) + '" />',
    '    <meta name="twitter:image" content="' + escapeHtml(socialImage) + '" />',
    '    <meta name="robots" content="index,follow,max-image-preview:large" />',
    '    ' + jsonScript(schemaFor(path, data)),
    '  </head>',
  ].join('\n'));
  html = html.replace('<div id="root"></div>', '<div id="root">' + fallbackContent(path, data) + '</div>');
  const file = path === '/' ? join(dist, 'index.html') : join(dist, path.slice(1), 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html, 'utf8');
  console.log('Prepared crawlable route', canonical, '->', file);
}
if (visited.size !== urls.length || visited.size !== Object.keys(pages).length) {
  throw Error('Sitemap and static HTML coverage do not match');
}
