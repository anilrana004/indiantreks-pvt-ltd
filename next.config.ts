import type { NextConfig } from "next";

/**
 * Careful CSP baseline — allows Razorpay checkout, Google OAuth/Fonts/Analytics,
 * Mapbox GL, and Cloudinary delivery without blocking the storefront.
 * Tighten further only after verifying third-party flows in staging.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://api.razorpay.com https://checkout.razorpay.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://lh3.googleusercontent.com https://i.ytimg.com https://*.mapbox.com https://*.razorpay.com https://indiantreks.in",
  "media-src 'self' https://res.cloudinary.com blob:",
  "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com https://*.mapbox.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://api.mapbox.com https://*.razorpay.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://accounts.google.com https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com https://api.mapbox.com",
  "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://res.cloudinary.com https://api.cloudinary.com https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://www.google-analytics.com https://www.googletagmanager.com https://vitals.vercel-insights.com",
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
  "child-src 'self' blob: https://checkout.razorpay.com",
].join("; ");

const nextConfig: NextConfig = {
  // Ensure the Mapbox public token is always available to client bundles.
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
  },
  images: {
    // Prefer AVIF, fall back to WebP for smaller payloads vs JPEG/PNG.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "indiantreks.in" },
      { protocol: "https", hostname: "roopkundheaven.in" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/treks/triund", destination: "/treks/mcleodganj-trek", permanent: true },
      { source: "/treks/triund-trek", destination: "/treks/mcleodganj-trek", permanent: true },
      { source: "/treks/gomukh-tapovan", destination: "/treks/gaumukh-tapovan", permanent: true },
      { source: "/yatra/char-dham-yatra", destination: "/yatra/char-dham", permanent: true },
      { source: "/special-programs/senior-citizen-treks", destination: "/senior-citizen-treks", permanent: true },
      { source: "/special-programs/family-treks", destination: "/family-treks", permanent: true },
      { source: "/special-programs/beginner-friendly-treks", destination: "/beginner-friendly-treks", permanent: true },
      { source: "/special-programs/women-only-treks", destination: "/women-only-treks", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-site",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "off",
          },
          {
            key: "Content-Security-Policy",
            value: CONTENT_SECURITY_POLICY,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
