'use strict';

const fs = require('fs');
const path = require('path');
const {
  SITE_ORIGIN,
  BRAND_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_OG_IMAGE_ALT,
  LOCALE,
  LANGUAGE,
  ORGANIZATION_LOGO_PATH,
  SOCIAL_PROFILES,
  absoluteUrl,
  assetUrl,
  canonicalUrl,
  normalizePath
} = require('./seo-config');

const root = path.resolve(__dirname, '..');
const indexFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === '.vercel' || entry.name === 'node_modules') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.name === 'index.html') indexFiles.push(fullPath);
  }
}

function escapeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function getAttribute(html, selector) {
  const match = html.match(selector);
  return match ? match[1] : '';
}

function routeFor(filePath) {
  const relative = path.relative(root, filePath).replace(/\\/g, '/');
  if (relative === 'index.html') return '/';
  return normalizePath(`/${relative.replace(/\/index\.html$/, '')}`);
}

function replaceOrInsert(html, pattern, replacement, anchor) {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace(anchor, `${replacement}\n${anchor}`);
}

function schemaFor({ route, title, description, pageType, isService }) {
  const organizationId = `${SITE_ORIGIN}/#organization`;
  const websiteId = `${SITE_ORIGIN}/#website`;
  const pageId = `${canonicalUrl(route)}#webpage`;
  const graph = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: BRAND_NAME,
      url: `${SITE_ORIGIN}/`,
      logo: { '@type': 'ImageObject', url: assetUrl(ORGANIZATION_LOGO_PATH) },
      sameAs: SOCIAL_PROFILES,
      founder: { '@type': 'Person', name: 'Scott Kerr', sameAs: ['https://www.linkedin.com/in/scott-kerr-22889b3/'] }
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      name: BRAND_NAME,
      url: `${SITE_ORIGIN}/`,
      inLanguage: LANGUAGE,
      publisher: { '@id': organizationId }
    },
    {
      '@type': pageType === 'ProfilePage' ? 'AboutPage' : pageType || 'WebPage',
      '@id': pageId,
      url: canonicalUrl(route),
      name: title,
      description,
      inLanguage: LANGUAGE,
      isPartOf: { '@id': websiteId },
      about: { '@id': organizationId }
    }
  ];
  if (isService) {
    graph.push({
      '@type': 'Service',
      '@id': `${canonicalUrl(route)}#service`,
      name: title.replace(/ \| World Events Network$/, ''),
      description,
      provider: { '@id': organizationId },
      url: canonicalUrl(route)
    });
  }
  const segments = route.split('/').filter(Boolean);
  if (segments.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl(route)}#breadcrumbs`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: BRAND_NAME, item: `${SITE_ORIGIN}/` },
        ...segments.map((segment, index) => ({
          '@type': 'ListItem',
          position: index + 2,
          name: segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          item: canonicalUrl(`/${segments.slice(0, index + 1).join('/')}`)
        }))
      ]
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

walk(root);
for (const filePath of indexFiles) {
  let html = fs.readFileSync(filePath, 'utf8');
  const route = routeFor(filePath);
  const title = getAttribute(html, /<title>([^<]*)<\/title>/i) || DEFAULT_TITLE;
  const description = getAttribute(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || DEFAULT_DESCRIPTION;
  let pageType = getAttribute(html, /<body[^>]*data-wen-page=["']([^"']*)["']/i) || 'WebPage';
  if (route === '/contact') pageType = 'ContactPage';
  if (route === '/expertise' || route === '/work') pageType = 'CollectionPage';
  const isService = getAttribute(html, /<body[^>]*data-wen-service=["']([^"']*)["']/i) === 'true';
  const noindex = route === '/404' || route === '/404.html' || route === '/privacy';
  const canonical = canonicalUrl(route === '/404.html' ? '/404' : route);
  const ogType = getAttribute(html, /<meta\s+property=["']og:type["']\s+content=["']([^"']*)["']/i) || 'website';
  const metadata = [
    `<meta name="application-name" content="${BRAND_NAME}">`,
    `<meta name="author" content="Scott Kerr, World Events Network">`,
    `<meta name="creator" content="Scott Kerr">`,
    `<meta name="publisher" content="${BRAND_NAME}">`,
    `<meta name="theme-color" content="#07111f">`,
    `<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow'}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:locale" content="${LOCALE}">`,
    `<meta property="og:image" content="${assetUrl(DEFAULT_OG_IMAGE_PATH)}">`,
    `<meta property="og:image:secure_url" content="${assetUrl(DEFAULT_OG_IMAGE_PATH)}">`,
    `<meta property="og:image:type" content="image/png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${DEFAULT_OG_IMAGE_ALT}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${assetUrl(DEFAULT_OG_IMAGE_PATH)}">`,
    `<meta name="twitter:image:alt" content="${DEFAULT_OG_IMAGE_ALT}">`,
    `<link rel="apple-touch-icon" href="/favicon-32x32.png">`,
    `<link rel="manifest" href="/manifest.webmanifest">`,
    `<link rel="canonical" href="${canonical}">`
  ].join('\n');
  html = html.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '');
  html = html.replace(/<link\s+rel=["']apple-touch-icon["'][^>]*>\s*/gi, '');
  html = html.replace(/<link\s+rel=["']manifest["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']application-name["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']author["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']creator["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']publisher["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']theme-color["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+property=["']og:locale["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+property=["']og:url["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']robots["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+property=["']og:image[^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']twitter:[^>]*>\s*/gi, '');
  html = html.replace(/<script[^>]*data-wen-schema[^>]*>[\s\S]*?<\/script>\s*/gi, '');
  html = html.replace(/<\/head>/i, `${metadata}\n<script type="application/ld+json" data-wen-schema="true">${escapeJson(schemaFor({ route, title, description, pageType, isService }))}</script>\n</head>`);
  fs.writeFileSync(filePath, html);
}

console.log(`SEO metadata generated for ${indexFiles.length} HTML routes.`);
