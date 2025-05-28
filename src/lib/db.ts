import { PrismaClient } from "@prisma/client";

declare global {
  // Using var is required for global scope in this case
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient;
}

export const db: PrismaClient = 
  process.env.NODE_ENV === "production"
    ? new PrismaClient()
    : global.cachedPrisma || (global.cachedPrisma = new PrismaClient());
