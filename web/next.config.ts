/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * next.config.ts — Desarrollo Integral
 * ═══════════════════════════════════════════════════════════════════════════════
 * SECURITY: Premium production-grade headers
 * PERFORMANCE: Optimized for speed and reliability
 * FIX TURBOPACK: Manual .env.local loading para workspace monorepo
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { NextConfig } from 'next';
import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY HEADERS — Premium Dark with Gold Theme
// ═══════════════════════════════════════════════════════════════════════════════

const securityHeaders = [
  // ─────────────────────────────────────────────────────────────────────────────
  // Content Security Policy — XSS Protection
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js dev requires unsafe-eval
      "style-src 'self' 'unsafe-inline'", // Inline styles for theme toggle
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://*.anthropic.com",
      "frame-ancestors 'none'", // Anti-clickjacking
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // HSTS — Force HTTPS (2 years, includeSubDomains, preload)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // X-Frame-Options — Anti-Clickjacking (redundant with CSP frame-ancestors)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // X-Content-Type-Options — Disable MIME Sniffing
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Referrer-Policy — Privacy Protection
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Permissions-Policy — Disable unnecessary browser features
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // X-DNS-Prefetch-Control — Control DNS prefetching
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TURBOPACK FIX — Manual .env.local loading
// ═══════════════════════════════════════════════════════════════════════════════
// Cuando hay dos package-lock.json (raíz + web/), Turbopack puede tomar el
// directorio padre como raíz del workspace y no cargar el .env.local correcto.
// Solucionamos cargando las variables manualmente desde el .env.local que está
// junto a ESTE archivo, antes de que Next.js arranque cualquier handler.

function loadEnvLocal() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf-8');
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIdx = line.indexOf('=');
    if (eqIdx < 0) continue;

    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim();

    // No sobreescribir variables ya inyectadas (ej: via $env:ANTHROPIC_API_KEY)
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

// ═══════════════════════════════════════════════════════════════════════════════
// NEXT.JS CONFIG — Premium Production Setup
// ═══════════════════════════════════════════════════════════════════════════════

const nextConfig: NextConfig = {
  // ─────────────────────────────────────────────────────────────────────────────
  // Security Headers
  // ─────────────────────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Production Optimizations
  // ─────────────────────────────────────────────────────────────────────────────
  poweredByHeader: false, // Hide "X-Powered-By: Next.js"
  reactStrictMode: true,  // Detect potential problems
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Image Optimization — Security & Performance
  // ─────────────────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Only Supabase CDN
      },
    ],
    formats: ['image/avif', 'image/webp'], // Modern formats first
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Turbopack Configuration
  // ─────────────────────────────────────────────────────────────────────────────
  turbopack: {
    root: __dirname,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Server External Packages — no bundlear en el servidor
  // Necesario para módulos con binarios nativos: FFmpeg, sharp, etc.
  // Turbopack/webpack no puede resolver las rutas internas de @ffmpeg-installer.
  // Con esta opción, Node.js los resuelve en runtime directamente.
  // ─────────────────────────────────────────────────────────────────────────────
  serverExternalPackages: [
    'fluent-ffmpeg',
    'ffmpeg-static',
    '@ffmpeg-installer/ffmpeg',
    '@ffmpeg-installer/win32-x64',
    '@ffprobe-installer/ffprobe',
    '@ffprobe-installer/win32-x64',
  ],
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Compiler Options
  // ─────────────────────────────────────────────────────────────────────────────
  compiler: {
    // Remove console.* in production (except errors)
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] } 
      : false,
  },
};

export default nextConfig;
// Force rebuild Wed Jun  3 12:11:20     2026
