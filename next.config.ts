import type { NextConfig } from "next";

import createNextIntlPlugin from 'next-intl/plugin';

// Crea il plugin next-intl
const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true, // ← AGGIUNTO!
    contentDispositionType: 'attachment', // ← AGGIUNTO!
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // ← AGGIUNTO!
  },
};

export default withNextIntl(nextConfig);
