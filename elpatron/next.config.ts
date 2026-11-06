import type { NextConfig } from "next";

// The site is fully static (no API routes or server features), so it is exported as plain HTML into
// `out/` and can be served by Cloudflare Workers static assets, Cloudflare Pages or any static host.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
