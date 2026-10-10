import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID || "local",
  },
  async rewrites() {
    return [
      {
        source: "/courts/osm/:type/:osmId/photos/:photo",
        destination: "/api/court-photos/:photo",
      },
      {
        source: "/courts/:source/:id/photos/:photo",
        destination: "/api/court-photos/:photo",
      },
    ];
  },
};

export default nextConfig;
