import { PUBLIC_ORIGIN, PUBLIC_LOCALES, publicPath } from '../src/publicSeo.js';
import { publicArticles } from '../src/publicArticles.js';

export function publicStructuredData(path, locale, t, { title, description, logoURL }) {
  const url = PUBLIC_ORIGIN + publicPath(path, locale);
  const page = { '@type': path === '/learn' ? 'CollectionPage' : 'WebPage', '@id': `${url}#page`,
    url, name: title, description, inLanguage: locale, isPartOf: { '@id': `${PUBLIC_ORIGIN}/#website` } };
  const graph = [
    { '@type': 'Organization', '@id': `${PUBLIC_ORIGIN}/#organization`, name: 'Rillora', url: PUBLIC_ORIGIN, logo: logoURL },
    { '@type': 'WebSite', '@id': `${PUBLIC_ORIGIN}/#website`, name: 'Rillora', url: PUBLIC_ORIGIN, inLanguage: PUBLIC_LOCALES,
      publisher: { '@id': `${PUBLIC_ORIGIN}/#organization` } },
    page,
  ];
  const article = publicArticles[path];
  if (article) {
    page.mainEntity = { '@id': `${url}#article` };
    page.breadcrumb = { '@id': `${url}#breadcrumb` };
    graph.push({ '@type': 'Article', '@id': `${url}#article`, headline: t(`public.learn.${article.key}.heading`),
      description, inLanguage: locale, mainEntityOfPage: { '@id': `${url}#page` },
      author: { '@id': `${PUBLIC_ORIGIN}/#organization` }, publisher: { '@id': `${PUBLIC_ORIGIN}/#organization` },
      datePublished: article.published, dateModified: article.modified,
      ...(article.sources ? { citation: article.sources.map(source => source.urls[locale]) } : {}),
    });
    graph.push({ '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('public.nav.home'), item: PUBLIC_ORIGIN + publicPath('/', locale) },
      { '@type': 'ListItem', position: 2, name: t('public.learn.link'), item: PUBLIC_ORIGIN + publicPath('/learn', locale) },
      { '@type': 'ListItem', position: 3, name: t(`public.learn.${article.key}.heading`), item: url },
    ] });
  }
  if (path === '/learn') {
    page.mainEntity = { '@id': `${url}#articles` };
    graph.push({ '@type': 'ItemList', '@id': `${url}#articles`, itemListElement: Object.entries(publicArticles).map(([href, item], index) => ({
      '@type': 'ListItem', position: index + 1, name: t(`public.learn.${item.key}.heading`), url: PUBLIC_ORIGIN + publicPath(href, locale),
    })) });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
