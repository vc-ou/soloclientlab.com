import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  },

  async headers() {
    // 安全响应头。CSP 采用"允许内联 + 白名单已知分析域名"的保守配置：
    // Next 的内联引导脚本需要 'unsafe-inline'；Umami/Plausible/Vercel 分析需要显式放行。
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cloud.umami.is https://plausible.io https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://cloud.umami.is https://plausible.io https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" }
        ]
      }
    ];
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
