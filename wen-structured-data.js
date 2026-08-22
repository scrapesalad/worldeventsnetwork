(() => {
  const page = document.querySelector('[data-wen-page]');
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'World Events Network',
    founder: {
      '@type': 'Person',
      name: 'Scott Kerr',
      jobTitle: 'Event Strategist, Race Director and Producer',
      sameAs: ['https://www.linkedin.com/in/scott-kerr-22889b3/']
    },
    sameAs: [
      'https://www.linkedin.com/company/world-events-network/',
      'https://www.facebook.com/worldeventsnetwork/'
    ]
  };
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Scott Kerr',
    jobTitle: 'Event Strategist, Race Director and Producer',
    worksFor: { '@type': 'Organization', name: 'World Events Network' },
    sameAs: ['https://www.linkedin.com/in/scott-kerr-22889b3/']
  };
  const graph = [organization, person];
  if (page) {
    const name = page.dataset.wenName || document.title;
    const description = page.dataset.wenDescription || document.querySelector('meta[name="description"]')?.content;
    graph.push({
      '@context': 'https://schema.org',
      '@type': page.dataset.wenPage || 'WebPage',
      name,
      description,
      isPartOf: { '@type': 'WebSite', name: 'World Events Network' }
    });
    if (page.dataset.wenService === 'true') {
      graph.push({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name,
        description,
        provider: { '@type': 'Organization', name: 'World Events Network' }
      });
    }
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      graph.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'World Events Network', item: '/' },
          ...segments.map((segment, index) => ({
            '@type': 'ListItem',
            position: index + 2,
            name: segment.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            item: `/${segments.slice(0, index + 1).join('/')}`
          }))
        ]
      });
    }
  }
  window.setTimeout(() => {
    if (document.querySelector('script[data-wen-schema]')) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.wenSchema = 'true';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    document.head.appendChild(script);
  }, 0);
})();
