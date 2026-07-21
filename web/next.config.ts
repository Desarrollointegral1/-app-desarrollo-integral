import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Minimal config to test build
  poweredByHeader: false,
  reactStrictMode: true,
  // Se sirve reverse-proxeada bajo desarrollointegral.app/web (ver
  // vercel.json de la raíz del repo, proyecto app-desarrollo-integral).
  basePath: '/web',
};

export default nextConfig;
