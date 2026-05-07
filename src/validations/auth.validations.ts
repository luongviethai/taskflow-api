import * as z from "zod";

export const loginUser = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const RegisterUser = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

export type loginUser = z.infer<typeof loginUser>;

export type RegisterUser = z.infer<typeof RegisterUser>;
