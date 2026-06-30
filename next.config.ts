import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: [
    "@whiskeysockets/baileys",
    "jimp",
    "sharp",
    "qrcode",
    "pino",
    "@hapi/boom",
    "mariadb",
  ],
};

export default nextConfig;
