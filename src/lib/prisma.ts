import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  let url = process.env.DATABASE_URL!;

  // mariadb driver requires "mariadb://" protocol, not "mysql://"
  if (url.startsWith("mysql://")) {
    url = url.replace("mysql://", "mariadb://");
  }

  // TiDB Cloud needs SSL
  if (url.includes("tidbcloud.com") && !url.includes("ssl")) {
    url += url.includes("?") ? "&ssl=true" : "?ssl=true";
  }

  const adapter = new PrismaMariaDb(url);
  return new PrismaClient({ adapter }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
