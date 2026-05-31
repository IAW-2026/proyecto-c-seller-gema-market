import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  turbopack: {},
  // Inlinea el CSS en el HTML (solo prod) para sacar el <link> render-blocking
  // del critical path: mejora FCP/LCP, sobre todo en mobile con red throttleada.
  experimental: { inlineCss: true },
  images: {
    // Imágenes servidas desde Supabase Storage (bucket público).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
