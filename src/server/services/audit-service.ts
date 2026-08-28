import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import type { Prisma } from "@prisma/client";

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  changes?: Prisma.InputJsonValue;
  reason?: string | null;
  ipAddress?: string | null;
}

export async function recordAuditLog(entry: AuditEntry, db: Db = prisma) {
  return db.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      changes: entry.changes,
      reason: entry.reason ?? null,
      ipAddress: entry.ipAddress ?? null,
    },
  });
}
