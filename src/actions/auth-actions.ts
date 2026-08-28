"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/schemas/auth";
import { registerCustomer, CustomerServiceError } from "@/server/services/customer-service";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function roleHomePath(role: string): string {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin";
  if (role === "EMPLOYEE") return "/empleado";
  return "/inicio";
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = formData.get("callbackUrl");

  // Resolved *before* signIn so we can hand NextAuth a single redirectTo and let
  // it set the session cookie and redirect in one atomic internal flow. Reading
  // the session back out via a separate auth() call right after signIn (the
  // previous approach) raced the cookie write on some browsers — intermittently
  // landing back on /login because the redirect target was computed from a
  // session that hadn't been readable yet.
  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  const redirectTo =
    typeof callbackUrl === "string" && callbackUrl ? callbackUrl : roleHomePath(user?.role ?? "CUSTOMER");

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos." };
    }
    throw error;
  }

  return {};
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const referralCode = String(formData.get("referralCode") ?? "").trim();

  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    birthDate: formData.get("birthDate"),
    acceptedTerms: formData.get("acceptedTerms") === "on",
    acceptedMarketing: formData.get("acceptedMarketing") === "on",
    referralCode: referralCode || undefined,
  });

  if (!parsed.success) {
    return {
      error: "Revisá los datos ingresados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await registerCustomer(parsed.data);
  } catch (error) {
    if (error instanceof CustomerServiceError) return { error: error.message };
    throw error;
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/inicio",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?registered=1");
    }
    throw error; // rethrow the redirect signIn() throws internally on success
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
