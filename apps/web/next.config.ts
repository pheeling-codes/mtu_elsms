import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Middleware matcher configuration
  // Defines which paths the middleware should run on
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  // Allow external avatar images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
