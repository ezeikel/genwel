import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/studio/', '/monitoring/', '/_next/'],
      },
    ],
    sitemap: 'https://genwel.com/sitemap.xml',
  };
}
