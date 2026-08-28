import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across invocations. On Vercel each warm
// serverless instance keeps this module in memory, so caching it on the
// global avoids opening a new Postgres connection pool per request.
const prisma = global.prismaGlobal ?? new PrismaClient();
global.prismaGlobal = prisma;

export default prisma;
