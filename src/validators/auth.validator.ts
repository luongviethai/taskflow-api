/**
 * src/validators/auth.validator.ts
 */

import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email format")
      .max(255)
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be 128 characters or less"),
    name: z.string().min(1, "Name is required").max(255).trim(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").trim().toLowerCase(),
    password: z.string().min(1, "Password is required"),
  }),
});

export type RegisterUser = z.infer<typeof registerSchema>["body"];
export type LoginUser = z.infer<typeof loginSchema>["body"];
