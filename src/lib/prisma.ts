import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildConnectionUrl(): string {
  let url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // mariadb driver requires "mariadb://" protocol, not "mysql://"
  if (url.startsWith("mysql://")) {
    url = url.replace("mysql://", "mariadb://");
  }

  // Parse existing params
  const hasParams = url.includes("?");
  const params = new URLSearchParams();

  // Serverless-friendly settings
  params.set("connectTimeout", "30000");
  params.set("socketTimeout", "30000");
  params.set("connectionLimit", "1");
  params.set("idleTimeout", "10000");

  // TiDB Cloud needs SSL
  if (url.includes("tidbcloud.com")) {
    params.set("ssl", "true");
  }

  if (hasParams) {
    // Append our params to existing ones
    const [base, existingParams] = url.split("?");
    const existing = new URLSearchParams(existingParams);
    // Don't override existing values
    for (const [key, value] of params) {
      if (!existing.has(key)) {
        existing.set(key, value);
      }
    }
    return `${base}?${existing.toString()}`;
  }

  return `${url}?${params.toString()}`;
}

function createPrismaClient(): PrismaClient {
  const url = buildConnectionUrl();
  const adapter = new PrismaMariaDb(url);
  return new PrismaClient({ adapter }) as unknown as PrismaClient;
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrisma();

export default prisma;
