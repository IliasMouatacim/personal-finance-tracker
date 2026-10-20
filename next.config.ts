import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${(process.env.API_SERVER_URL || "http://127.0.0.1:3001").replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
};
export default nextConfig;
