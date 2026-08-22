'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SITE_ORIGIN, canonicalUrl, normalizePath } = require('./seo-config');

assert.equal(normalizePath('/about/?utm_source=test#section'), '/about');
assert.equal(canonicalUrl('/about/?gclid=test#section'), `${SITE_ORIGIN}/about`);
assert.equal(canonicalUrl('/'), `${SITE_ORIGIN}/`);

const root = path.resolve(__dirname, '..');
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', '.vercel', 'node_modules'].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name === 'index.html') files.push(file);
  }
}
walk(root);

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file).replace(/\\/g, '/');
  const route = relative === 'index.html' ? '/' : `/${relative.replace(/\/index\.html$/, '')}`;
  const canonicals = [...html.matchAll(/<link[^>]+rel=["']canonical["'][^>]+>/gi)];
  const canonical = canonicals[0]?.[0].match(/href=["']([^"']+)/i)?.[1];
  assert.equal(canonicals.length, 1, `${route} must have one canonical`);
  assert.equal(canonical, canonicalUrl(route), `${route} canonical mismatch`);
  assert.match(html, /<meta name=["']description["'][^>]+content=["'][^"']+/i, `${route} needs a description`);
  assert.match(html, /<script type=["']application\/ld\+json["'][^>]*data-wen-schema/i, `${route} needs JSON-LD`);
}

console.log(`SEO smoke tests passed for ${files.length} HTML routes.`);
