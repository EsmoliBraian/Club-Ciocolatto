"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/lib/auth";
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

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos." };
    }
    throw error;
  }

  const session = await auth();
  const role = session?.user.role;
  redirect(typeof callbackUrl === "string" && callbackUrl ? callbackUrl : roleHomePath(role ?? "CUSTOMER"));
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
      redirect: false,
    });
  } catch {
    redirect("/login?registered=1");
  }

  redirect("/inicio");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
