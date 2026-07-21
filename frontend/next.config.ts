import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "://unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Configures modern Turbopack aliasing to replace html2canvas
  turbopack: {
    resolveAlias: {
      html2canvas: "html2canvas-pro",
    },
  },
  // Keeps legacy Webpack fallback active for production builds
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      html2canvas: "html2canvas-pro",
    };
    return config;
  },
};

export default nextConfig;
