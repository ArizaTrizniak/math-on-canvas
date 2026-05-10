import type { NextConfig } from "next";

const EDITOR_URL = process.env.EDITOR_URL || "http://localhost:5173";
const DOCS_URL = process.env.DOCS_URL || "http://localhost:4321";

const nextConfig: NextConfig = {
  reactCompiler: true,

  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "0.0.0",
    NEXT_PUBLIC_AUTH_API_URL: process.env.AUTH_API_URL || "https://api.math-on-canvas.com",
  },

  rewrites: async () => ({
    afterFiles: [
      {
        source: "/editor",
        destination: `${EDITOR_URL}/editor/`,
      },
      {
        source: "/editor/:path*",
        destination: `${EDITOR_URL}/editor/:path*`,
      },
      {
        source: "/docs",
        destination: `${DOCS_URL}/docs/`,
      },
      {
        source: "/docs/:path*",
        destination: `${DOCS_URL}/docs/:path*`,
      },
      {
        source: "/assets/:path*",
        destination: `${EDITOR_URL}/editor/assets/:path*`,
      },
    ],
  }),

  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "Access-Control-Allow-Credentials", value: "true" },
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
      ],
    },
  ],
};

export default nextConfig;
