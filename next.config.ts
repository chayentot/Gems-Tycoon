import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Gems-Tycoon",
  assetPrefix: "/Gems-Tycoon/",
  trailingSlash: true,
  images: { unoptimized: true }
};
export default nextConfig;
