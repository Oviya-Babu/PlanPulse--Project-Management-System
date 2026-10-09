import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(val: string): boolean {
  if (!dateRegex.test(val)) return false;
  const [year, month, day] = val.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const dateSchema = z
  .string({ invalid_type_error: 'Date must be a string in YYYY-MM-DD format.' })
  .refine(isValidDateString, { message: 'Date must be a valid calendar date in YYYY-MM-DD format.' });

export const projectIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Project ID must be a valid UUID.' }),
}).strict();

export const createProjectSchema = z
  .object({
    name: z
      .string({ required_error: 'Project name is required.' })
      .trim()
      .min(1, { message: 'Project name must not be empty.' })
      .max(120, { message: 'Project name must be at most 120 characters.' }),
    description: z
      .string()
      .max(2000, { message: 'Description must be at most 2000 characters.' })
      .optional()
      .default(''),
    status: z
      .nativeEnum(ProjectStatus, {
        errorMap: () => ({ message: 'Status must be NOT_STARTED, IN_PROGRESS, or COMPLETED.' }),
      })
      .optional()
      .default(ProjectStatus.NOT_STARTED),
    startDate: dateSchema.nullable().optional(),
    endDate: dateSchema.nullable().optional(),
  })
  .strict({ message: 'Unrecognized fields in request body are forbidden.' })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after start date.',
      path: ['endDate'],
    }
  );

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: 'Project name must not be empty.' })
      .max(120, { message: 'Project name must be at most 120 characters.' })
      .optional(),
    description: z
      .string()
      .max(2000, { message: 'Description must be at most 2000 characters.' })
      .optional(),
    status: z
      .nativeEnum(ProjectStatus, {
        errorMap: () => ({ message: 'Status must be NOT_STARTED, IN_PROGRESS, or COMPLETED.' }),
      })
      .optional(),
    startDate: dateSchema.nullable().optional(),
    endDate: dateSchema.nullable().optional(),
  })
  .strict({ message: 'Unrecognized fields in request body are forbidden.' })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update.',
  });

export const projectQuerySchema = z
  .object({
    search: z
      .string()
      .max(100, { message: 'Search term must be at most 100 characters.' })
      .optional(),
    status: z
      .nativeEnum(ProjectStatus, {
        errorMap: () => ({ message: 'Status must be NOT_STARTED, IN_PROGRESS, or COMPLETED.' }),
      })
      .optional(),
  })
  .strict({ message: 'Unrecognized query parameters are forbidden.' });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;
