import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Middleware matcher configuration
  // Defines which paths the middleware should run on
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
};

export default nextConfig;
