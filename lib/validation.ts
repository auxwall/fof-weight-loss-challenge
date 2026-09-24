import { z } from "zod";

/**
 * Zod Schema for Participant Registration
 */
export const RegisterSchema = z.object({
  name: z
    .string({ error: "Full name is required." })
    .trim()
    .min(3, "Full name must be at least 3 characters.")
    .max(100, "Full name cannot exceed 100 characters."),

  emiratesId: z
    .string({ error: "Emirates ID is required." })
    .trim()
    .refine(
      (val) => {
        const clean = val.replace(/\D/g, "");
        return clean.length === 15 && clean.startsWith("784");
      },
      {
        message: "Emirates ID must be 15 digits starting with 784 (e.g. 784-1990-1234567-1).",
      }
    ),

  mobile: z
    .string({ error: "Mobile number is required." })
    .trim()
    .refine(
      (val) => {
        const clean = val.replace(/[\s\-\(\)]/g, "");
        const uaeRegex = /^(?:\+971|00971|0)?5[0-9]{8}$/;
        const intlRegex = /^\+?[0-9]{9,15}$/;
        return uaeRegex.test(clean) || intlRegex.test(clean);
      },
      {
        message: "Please enter a valid mobile number (e.g. 050 123 4567).",
      }
    ),

  email: z
    .string({ error: "Email address is required." })
    .trim()
    .email("Please enter a valid email address (e.g. yourname@domain.com).")
    .refine(
      (val) => {
        const parts = val.split("@");
        if (parts.length !== 2) return false;
        const domain = parts[1];
        return domain.includes(".") && domain.split(".").pop()!.length >= 2;
      },
      {
        message: "Email must include a valid domain extension (e.g. .com, .ae).",
      }
    ),

  gender: z.enum(["MALE", "FEMALE"], {
    error: "Please select your gender.",
  }),

  dob: z
    .string({ error: "Date of birth is required." })
    .trim()
    .min(1, "Date of birth is required.")
    .refine(
      (val) => {
        const d = new Date(val);
        return !isNaN(d.getTime()) && d < new Date();
      },
      {
        message: "Please enter a valid date of birth.",
      }
    ),

  branchId: z
    .string({ error: "Please select your club." })
    .trim()
    .min(1, "Please select your primary gym club."),

  termsAccepted: z.literal(true, {
    error: "You must accept the terms and conditions to register.",
  }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Format Emirates ID into 784-XXXX-XXXXXXX-X as the user types
 */
export function formatEmiratesId(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 15);
  let formatted = "";
  if (digits.length > 0) formatted += digits.slice(0, 3);
  if (digits.length > 3) formatted += "-" + digits.slice(3, 7);
  if (digits.length > 7) formatted += "-" + digits.slice(7, 14);
  if (digits.length > 14) formatted += "-" + digits.slice(14, 15);
  return formatted;
}
