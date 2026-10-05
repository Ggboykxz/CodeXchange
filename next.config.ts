import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Type errors must fail the build — `ignoreBuildErrors` stays off so a
  // broken type can never reach production. (Next 16 removed the `eslint`
  // config key: lint runs through `npm run lint` instead.)
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
};

export default nextConfig;
