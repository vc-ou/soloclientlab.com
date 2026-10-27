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
      // 辅助页面（resources）前台已下线：`app/resources/**` 路由已删除，
      // 这里把整棵子树（含历史外链与已收录 URL）统一 301 到研究索引，避免 404 掉权重。
      {
        source: "/resources",
        destination: "/research",
        permanent: true
      },
      {
        source: "/resources/:path*",
        destination: "/research",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
