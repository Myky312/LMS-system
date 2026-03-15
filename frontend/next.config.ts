import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optional: allow API proxy in dev if frontend runs on different port
  // async rewrites() {
  //   return [{ source: '/api/v1/:path*', destination: 'http://localhost:3000/api/v1/:path*' }];
  // },
};

export default nextConfig;
