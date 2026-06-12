import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * En dev, sans NEXT_PUBLIC_API_URL, le front appelle `/api/v1/...` sur le même hôte que Next
 * (ex. :4000) et ces requêtes sont relayées vers l’API Nest (évite CORS / mauvaise URL client).
 * Surcharger dans `frontend/.env.local` : API_PROXY_TARGET=http://127.0.0.1:3000
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: frontendRoot,
  },
  async rewrites() {
    const target = (
      process.env.API_PROXY_TARGET?.trim() || "http://127.0.0.1:3000"
    ).replace(/\/+$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${target}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
