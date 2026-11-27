import { useEffect } from 'react';
import { SITE_CONFIG } from '@/config/site';

interface PageMetaProps {
  title: string;
  description?: string;
  jsonLd?: Record<string, unknown> | null;
}

export function PageMeta({ title, description, jsonLd }: PageMetaProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_CONFIG.brandName)
      ? title
      : `${title} — ${SITE_CONFIG.brandName}`;
    document.title = fullTitle;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    const scriptId = 'pb-jsonld';
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    if (jsonLd) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [title, description, jsonLd]);

  return null;
}
