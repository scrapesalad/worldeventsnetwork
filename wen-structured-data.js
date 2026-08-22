(() => {
  const page = document.querySelector('[data-wen-page]');
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
  }
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  document.head.appendChild(script);
})();
