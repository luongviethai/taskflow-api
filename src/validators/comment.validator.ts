import { z } from "zod";

export const createCommentSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid task ID"),
  }),
  body: z.object({
    content: z
      .string()
      .min(1, "Comment content is required")
      .max(5000, "Comment content must be 5000 characters or less")
      .trim(),
  }),
});

export const commentParamsSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid comment ID"),
  }),
});
