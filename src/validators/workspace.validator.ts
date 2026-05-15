/**
 * src/validators/workspace.validator.ts
 */

import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Workspace name is required')
      .max(100, 'Workspace name must be 100 characters or less')
      .trim(),
  }),
});

export const workspaceParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid workspace ID'),
  }),
});

export const addMemberSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid workspace ID'),
  }),
  body: z.object({
    user_id: z.number().int().positive('Invalid user ID'),
    role: z.enum(['member', 'viewer'], {
      error: 'Role must be "member" or "viewer"',
    }),
  }),
});

export const createProjectSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid workspace ID'),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Project name is required')
      .max(200, 'Project name must be 200 characters or less')
      .trim(),
    description: z
      .string()
      .max(2000, 'Description must be 2000 characters or less')
      .optional()
      .default(''),
  }),
});
