import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
