import { z } from "zod";

const customerIdentifier = z
  .object({
    qrToken: z.string().trim().optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().optional(),
  })
  .refine((v) => v.qrToken || v.email || v.phone, {
    message: "Debe incluir qrToken, email o phone",
  });

export const integrationOrderSchema = z.object({
  customer: customerIdentifier,
  externalReference: z.string().trim().min(1),
  totalAmount: z.coerce.number().positive().optional(),
  paymentMethod: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        externalSku: z.string().trim().optional(),
        name: z.string().trim().min(1),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().nonnegative(),
      })
    )
    .optional(),
});
export type IntegrationOrderInput = z.infer<typeof integrationOrderSchema>;

export const integrationCustomerSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().optional(),
  birthDate: z.coerce.date().optional(),
});
export type IntegrationCustomerInput = z.infer<typeof integrationCustomerSchema>;

export const integrationRefundSchema = z.object({
  externalReference: z.string().trim().min(1),
  reason: z.string().trim().optional(),
});
export type IntegrationRefundInput = z.infer<typeof integrationRefundSchema>;
