import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import { withPlausibleProxy } from 'next-plausible';

const nextConfig: NextConfig = {
  typescript: {
    // TODO: Fix v0-generated component type errors and enable strict checking
    ignoreBuildErrors: true,
  },
  // Cache strategy for different data types
  cacheLife: {
    // Blog/static content - rarely changes after publication
    blog: {
      stale: 60 * 60, // 1 hour
      revalidate: 60 * 60 * 24, // 24 hours
      expire: 60 * 60 * 24 * 30, // 30 days
    },
    // User-specific data (waitlist, preferences)
    'user-data': {
      stale: 60 * 5, // 5 minutes
      revalidate: 60 * 60, // 1 hour
      expire: 60 * 60 * 24, // 24 hours
    },
    // Reference data (categories, authors) - rarely changes
    'reference-data': {
      stale: 60 * 60 * 24, // 24 hours
      revalidate: 60 * 60 * 24 * 7, // 7 days
      expire: 60 * 60 * 24 * 90, // 90 days
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  async rewrites() {
    return [
      // PostHog proxy
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://eu.i.posthog.com/decide',
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

const sentryConfig = withSentryConfig(nextConfig, {
  org: 'chewybytes',
  project: 'genwel-web',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});

export default withPlausibleProxy()(sentryConfig);
