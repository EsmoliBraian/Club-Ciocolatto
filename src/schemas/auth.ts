import { z } from "zod";
import { FAVORITE_DRINK_OPTIONS } from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ingresá un email válido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export type LoginInput = z.infer<typeof loginSchema>;

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[a-z]/, "Debe incluir al menos una minúscula")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
  .regex(/[0-9]/, "Debe incluir al menos un número");

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Ingresá tu nombre"),
  lastName: z.string().trim().min(2, "Ingresá tu apellido"),
  email: z.string().trim().toLowerCase().email("Ingresá un email válido"),
  phone: z
    .string()
    .trim()
    .min(6, "Ingresá un teléfono válido")
    .max(20, "Ingresá un teléfono válido"),
  password: passwordSchema,
  birthDate: z.coerce.date().max(new Date(), "Fecha inválida"),
  favoriteDrink: z.enum(FAVORITE_DRINK_OPTIONS, { error: "Elegí tu bebida favorita" }),
  acceptedTerms: z.literal(true, {
    error: "Debés aceptar los términos y condiciones",
  }),
  acceptedMarketing: z.boolean().default(false),
  referralCode: z.string().trim().toUpperCase().optional().or(z.literal("")),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2, "Ingresá tu nombre"),
  lastName: z.string().trim().min(2, "Ingresá tu apellido"),
  phone: z.string().trim().min(6, "Ingresá un teléfono válido").max(20, "Ingresá un teléfono válido"),
  birthDate: z.coerce.date().max(new Date(), "Fecha inválida"),
  favoriteDrink: z.enum(FAVORITE_DRINK_OPTIONS, { error: "Elegí tu bebida favorita" }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ingresá un email válido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Link inválido"),
  password: passwordSchema,
});
