import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Accepted by every service function so callers can either pass the module-level
 * `prisma` client for a standalone read, or an interactive transaction client
 * (`prisma.$transaction(async (tx) => ...)`) so a whole multi-step flow (e.g. a
 * purchase: order + points + missions + tier + notifications + audit) commits
 * or rolls back atomically.
 */
export type Db = PrismaClient | Prisma.TransactionClient;
