/**
 * src/validators/task.validator.ts
 */

import { z } from 'zod';

export const taskStatusEnum = z.enum(['todo', 'in_progress', 'done']);

export const createTaskSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid project ID'),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, 'Task title is required')
      .max(500, 'Task title must be 500 characters or less')
      .trim(),
    description: z
      .string()
      .max(5000, 'Description must be 5000 characters or less')
      .optional()
      .default(''),
    status: taskStatusEnum.optional().default('todo'),
    assignee_id: z.number().int().positive().optional().nullable(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid task ID'),
  }),
  body: z
    .object({
      title: z.string().min(1).max(500).trim().optional(),
      description: z.string().max(5000).optional(),
      status: taskStatusEnum.optional(),
      assignee_id: z.number().int().positive().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

export const listTasksQuerySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid project ID'),
  }),
  query: z.object({
    status: taskStatusEnum.optional(),
  }),
});

export const assignTaskSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid task ID'),
  }),
  body: z.object({
    assignee_id: z.number().int().positive('Invalid assignee ID'),
  }),
});

export const taskParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid task ID'),
  }),
});
