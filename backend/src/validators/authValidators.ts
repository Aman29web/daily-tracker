import { z } from "zod";
import { isValidTimezone } from "../utils/dateUtils";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required").max(80),
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: passwordSchema,
    timezone: z
      .string()
      .refine(isValidTimezone, "Invalid IANA timezone")
      .default("UTC"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1, "Password is required"),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: passwordSchema,
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    timezone: z.string().refine(isValidTimezone, "Invalid IANA timezone").optional(),
    avatarColor: z.string().optional(),
  }),
});
