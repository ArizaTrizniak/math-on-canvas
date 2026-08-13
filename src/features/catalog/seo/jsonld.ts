export function creativeWork(input: {
  name: string; description: string; image?: string; inLanguage: string; url: string; dateModified: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: input.name,
    description: input.description,
    ...(input.image ? { image: input.image } : {}),
    inLanguage: input.inLanguage,
    url: input.url,
    dateModified: input.dateModified,
    isAccessibleForFree: true,
    publisher: { '@type': 'Organization', name: 'Math on Canvas' },
  }
}

export function breadcrumbList(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: it.url,
    })),
  }
}

export function collectionPage(input: { name: string; url: string; itemUrls: string[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    url: input.url,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: input.itemUrls.map((u, i) => ({ '@type': 'ListItem', position: i + 1, url: u })),
    },
  }
}
