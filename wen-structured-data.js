(() => {
  const origin = 'https://worldeventnetwork.com';
  const defaultTitle = 'World Events Network | Sports & Mass Participation Event Experts';
  const defaultDescription = 'World Events Network develops, grows and delivers mass-participation sporting events and live experiences through strategy, marketing, operations, athlete recruitment and production.';
  const ogImage = `${origin}/public/images/seo/world-events-network-og.png`;
  const path = `${window.location.pathname}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  const canonical = `${origin}${path}`;
  const page = document.querySelector('[data-wen-page]');
  const title = page?.dataset.wenName ? `${page.dataset.wenName} | World Events Network` : defaultTitle;
  const description = page?.dataset.wenDescription || defaultDescription;
  const noindex = path === '/404' || path === '/privacy';

  function setMeta(selector, attributes) {
    let node = document.head.querySelector(selector);
    if (!node) { node = document.createElement('meta'); document.head.appendChild(node); }
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  }

  function restoreMetadata() {
    document.title = title;
    setMeta('meta[name="description"]', { name: 'description', content: description });
    setMeta('meta[name="robots"]', { name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    setMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage });
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage });
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = canonical;
  }

  function restoreSchema() {
    if (document.querySelector('script[data-wen-schema]')) return;
    const organizationId = `${origin}/#organization`;
    const websiteId = `${origin}/#website`;
    const pageId = `${canonical}#webpage`;
    const organization = { '@type': 'Organization', '@id': organizationId, name: 'World Events Network', url: `${origin}/`, logo: { '@type': 'ImageObject', url: `${origin}/favicon-32x32.png` }, sameAs: ['https://www.linkedin.com/company/world-events-network/', 'https://www.facebook.com/worldeventsnetwork/'], founder: { '@type': 'Person', name: 'Scott Kerr', sameAs: ['https://www.linkedin.com/in/scott-kerr-22889b3/'] } };
    const type = page?.dataset.wenPage === 'ProfilePage' ? 'AboutPage' : (page?.dataset.wenPage || 'WebPage');
    const graph = [organization, { '@type': 'WebSite', '@id': websiteId, name: 'World Events Network', url: `${origin}/`, inLanguage: 'en-US', publisher: { '@id': organizationId } }, { '@type': type, '@id': pageId, url: canonical, name: title, description, inLanguage: 'en-US', isPartOf: { '@id': websiteId }, about: { '@id': organizationId } }];
    if (page?.dataset.wenService === 'true') graph.push({ '@type': 'Service', '@id': `${canonical}#service`, name: title.replace(/ \| World Events Network$/, ''), description, provider: { '@id': organizationId }, url: canonical });
    const script = document.createElement('script'); script.type = 'application/ld+json'; script.dataset.wenSchema = 'true'; script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c'); document.head.appendChild(script);
  }

  const repair = () => { restoreMetadata(); restoreSchema(); };
  repair(); window.setTimeout(repair, 250); window.setTimeout(repair, 1200);
})();
