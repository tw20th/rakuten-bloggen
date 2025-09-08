// functions/src/seo/applyStructuredData.ts
export function buildArticleJsonLd(input: {
  url: string;
  title: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  author: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    image: input.image ? [input.image] : [],
    author: { "@type": "Person", name: input.author },
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    mainEntityOfPage: input.url,
  };
}

export function buildBreadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function buildFaqJsonLd(qa: { q: string; a: string }[]) {
  if (!qa.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
