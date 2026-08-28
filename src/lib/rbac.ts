import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getCustomerProfileByUserId } from "@/server/services/customer-service";

export class UnauthorizedError extends Error {
  constructor(message = "No autenticado") {
    super(message);
  }
}

export class ForbiddenError extends Error {
  constructor(message = "No autorizado") {
    super(message);
  }
}

/** Throws if there is no session. Every Server Action must call this (or requireRole) itself — Proxy is not the authorization boundary. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  return session.user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

export async function requireCustomerProfile() {
  const user = await requireRole("CUSTOMER");
  const profile = await getCustomerProfileByUserId(user.id);
  if (!profile) throw new Error("Perfil de cliente no encontrado");
  return { user, profile };
}

export const STAFF_ROLES: Role[] = ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"];
export const ADMIN_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN"];
