import type { NextConfig } from "next";

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
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;