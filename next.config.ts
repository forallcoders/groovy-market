import dotenv from "dotenv"
import type { NextConfig } from "next"

dotenv.config()

const nextConfig: NextConfig = {
  /* config options here */
  rewrites: async () => [
    {
      source: "/march-chadness",
      destination: `${process.env.NEXT_PUBLIC_MARCH_CHADNESS_URL_BASE}/march-chadness`,
      basePath: false,
    },
    {
      source: "/march-chadness/:path*",
      destination: `${process.env.NEXT_PUBLIC_MARCH_CHADNESS_URL_BASE}/march-chadness/:path*`,
      basePath: false,
    },
  ],
  images: {
    remotePatterns: [
      {
        hostname: "groovy.market",
        protocol: "https",
      },
      {
        hostname: "media.api-sports.io",
        protocol: "https",
      },
      {
        hostname: "groovy-sports-league-logos.s3.us-east-2.amazonaws.com",
        protocol: "https",
      },
    ],
  },
  trailingSlash: false,
}

export default nextConfig
