import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  },
  async redirects() {
    return [
      {
        source: "/newsletter",
        destination: "/research",
        permanent: true
      },
      {
        source: "/resources",
        destination: "/research",
        permanent: true
      },
      {
        source: "/resources/client-acquisition-report",
        destination: "/research",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
