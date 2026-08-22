'use strict';

const SITE_ORIGIN = 'https://worldeventnetwork.com';
const BRAND_NAME = 'World Events Network';
const DEFAULT_TITLE = 'World Events Network | Sports & Mass Participation Event Experts';
const TITLE_TEMPLATE = '%s | World Events Network';
const DEFAULT_DESCRIPTION = 'World Events Network develops, grows and delivers mass-participation sporting events and live experiences through strategy, marketing, operations, athlete recruitment and production.';
const DEFAULT_OG_IMAGE_PATH = '/public/images/seo/world-events-network-og.png';
const DEFAULT_OG_IMAGE_ALT = 'World Events Network — sporting and live event strategy, growth and production';
const LOCALE = 'en_US';
const LANGUAGE = 'en-US';
const ORGANIZATION_LOGO_PATH = '/favicon-32x32.png';
const SOCIAL_PROFILES = [
  'https://www.linkedin.com/company/world-events-network/',
  'https://www.facebook.com/worldeventsnetwork/'
];

function normalizePath(value) {
  let path = String(value || '/').trim();
  try {
    path = new URL(path, SITE_ORIGIN).pathname;
  } catch {}
  path = path.replace(/\/+/g, '/').replace(/\/index\.html$/, '');
  if (!path.startsWith('/')) path = `/${path}`;
  if (path !== '/') path = path.replace(/\/+$/, '');
  return path || '/';
}

function absoluteUrl(path) {
  return `${SITE_ORIGIN}${normalizePath(path)}`;
}

function canonicalUrl(path) {
  return absoluteUrl(path);
}

function assetUrl(path) {
  return absoluteUrl(path);
}

module.exports = {
  SITE_ORIGIN,
  BRAND_NAME,
  DEFAULT_TITLE,
 TITLE_TEMPLATE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_OG_IMAGE_ALT,
  LOCALE,
  LANGUAGE,
  ORGANIZATION_LOGO_PATH,
  SOCIAL_PROFILES,
  normalizePath,
  absoluteUrl,
  canonicalUrl,
  assetUrl
};
