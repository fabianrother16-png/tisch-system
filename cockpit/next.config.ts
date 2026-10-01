import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: process.cwd() },
  // Native/Node-Pakete nicht bundeln
  serverExternalPackages: [
    "@libsql/client",
    "@react-pdf/renderer",
    "nodemailer",
    "imapflow",
    "mailparser",
    "qrcode",
  ],
  // SQL-Migrationen werden zur Laufzeit gelesen und müssen mit ausgeliefert werden
  outputFileTracingIncludes: {
    "/**": ["./drizzle/**/*"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
