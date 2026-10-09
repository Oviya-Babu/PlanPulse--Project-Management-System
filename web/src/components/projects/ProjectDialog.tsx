import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Project, ProjectStatus } from '../../types';
import { createProject, updateProject } from '../../api/projects';
import { getApiErrorMessage } from '../../lib/api';

const projectFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Project name is required.')
      .max(120, 'Project name must be at most 120 characters.'),
    description: z.string().max(2000, 'Description must be at most 2000 characters.').default(''),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
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

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSuccess: () => void;
}

export const ProjectDialog: React.FC<ProjectDialogProps> = ({
  open,
  onOpenChange,
  project,
  onSuccess,
}) => {
  const isEditing = Boolean(project);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'NOT_STARTED',
      startDate: '',
      endDate: '',
    },
  });

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
        status: project.status,
        startDate: project.startDate || '',
        endDate: project.endDate || '',
      });
    } else {
      reset({
        name: '',
        description: '',
        status: 'NOT_STARTED',
        startDate: '',
        endDate: '',
      });
    }
  }, [project, reset, open]);

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        status: data.status as ProjectStatus,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
      };

      if (isEditing && project) {
        await updateProject(project.id, payload);
        toast.success('Project updated.');
      } else {
        await createProject(payload);
        toast.success('Project created.');
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const message = getApiErrorMessage(err);
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details and schedule for your project.'
              : 'Add a new project to organize tasks and track progress.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Project Name */}
          <div className="space-y-1.5">
            <label htmlFor="projectName" className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Project Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="projectName"
              placeholder="e.g. Website Redesign"
              {...register('name')}
              aria-invalid={Boolean(errors.name)}
              className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="projectDesc" className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Description
            </label>
            <textarea
              id="projectDesc"
              rows={3}
              placeholder="Brief overview of project goals..."
              {...register('description')}
              className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:text-slate-100"
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label htmlFor="projectStatus" className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Status
            </label>
            <select
              id="projectStatus"
              {...register('status')}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            {errors.status && (
              <p className="text-xs text-red-500">{errors.status.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="startDate" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Start Date
              </label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
              />
              {errors.startDate && (
                <p className="text-xs text-red-500">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="endDate" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                End Date
              </label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                aria-invalid={Boolean(errors.endDate)}
                className={errors.endDate ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.endDate && (
                <p className="text-xs text-red-500">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
