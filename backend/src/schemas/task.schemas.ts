import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

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

export const taskIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Task ID must be a valid UUID.' }),
}).strict();

export const createTaskSchema = z
  .object({
    projectId: z.string().uuid({ message: 'Project ID must be a valid UUID.' }),
    name: z
      .string({ required_error: 'Task name is required.' })
      .trim()
      .min(1, { message: 'Task name must not be empty.' })
      .max(150, { message: 'Task name must be at most 150 characters.' }),
    description: z
      .string()
      .max(2000, { message: 'Description must be at most 2000 characters.' })
      .optional()
      .default(''),
    priority: z
      .nativeEnum(TaskPriority, {
        errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, or HIGH.' }),
      })
      .optional()
      .default(TaskPriority.MEDIUM),
    status: z
      .nativeEnum(TaskStatus, {
        errorMap: () => ({ message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED.' }),
      })
      .optional()
      .default(TaskStatus.PENDING),
    dueDate: dateSchema.nullable().optional(),
  })
  .strict({ message: 'Unrecognized fields in request body are forbidden.' });

export const updateTaskSchema = z
  .object({
    projectId: z.never({ message: 'Changing projectId is not allowed.' }).optional(),
    name: z
      .string()
      .trim()
      .min(1, { message: 'Task name must not be empty.' })
      .max(150, { message: 'Task name must be at most 150 characters.' })
      .optional(),
    description: z
      .string()
      .max(2000, { message: 'Description must be at most 2000 characters.' })
      .optional(),
    priority: z
      .nativeEnum(TaskPriority, {
        errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, or HIGH.' }),
      })
      .optional(),
    status: z
      .nativeEnum(TaskStatus, {
        errorMap: () => ({ message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED.' }),
      })
      .optional(),
    dueDate: dateSchema.nullable().optional(),
  })
  .strict({ message: 'Unrecognized fields in request body are forbidden.' })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update.',
  });

export const taskQuerySchema = z
  .object({
    projectId: z.string().uuid({ message: 'Project ID must be a valid UUID.' }).optional(),
    search: z
      .string()
      .max(100, { message: 'Search term must be at most 100 characters.' })
      .optional(),
    status: z
      .nativeEnum(TaskStatus, {
        errorMap: () => ({ message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED.' }),
      })
      .optional(),
    priority: z
      .nativeEnum(TaskPriority, {
        errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, or HIGH.' }),
      })
      .optional(),
  })
  .strict({ message: 'Unrecognized query parameters are forbidden.' });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
