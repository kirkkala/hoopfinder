import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Inlined into the browser build. A new Vercel deploy asks for a court list the phone has not stored.
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
