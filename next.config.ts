import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true, remotePatterns: [{ protocol: "http", hostname: "localhost", port: "8080", pathname: "/uploads/**" }, { protocol: "https", hostname: "**", pathname: "/uploads/**" }] },
};

export default nextConfig;
