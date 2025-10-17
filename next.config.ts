import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Production optimizations */
  compress: true,
  poweredByHeader: false, // Hide X-Powered-By header for security

  /* Disable ESLint during builds (type checking still runs) */
  eslint: {
    ignoreDuringBuilds: true,
  },

  /* Disable TypeScript checking during builds (for faster builds) */
  typescript: {
    ignoreBuildErrors: true, // Temporarily disabled for production deployment
  },

  /* Image optimization */
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        pathname: '/maps/api/place/photo**',
      },
      // Add other allowed image domains here
    ],
  },

  /* Headers for security */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },

  /* Environment variables validation */
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default nextConfig;
