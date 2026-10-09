import React, { useEffect, useState } from 'react';
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
import { Task, TaskPriority, TaskStatus, Project } from '../../types';
import { createTask, updateTask } from '../../api/tasks';
import { getProjects } from '../../api/projects';
import { getApiErrorMessage } from '../../lib/api';

const taskFormSchema = z.object({
  projectId: z.string().uuid('Please select a valid project.'),
  name: z
    .string()
    .trim()
    .min(1, 'Task name is required.')
    .max(150, 'Task name must be at most 150 characters.'),
  description: z.string().max(2000, 'Description must be at most 2000 characters.').default(''),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultProjectId?: string;
  onSuccess: () => void;
}

export const TaskDialog: React.FC<TaskDialogProps> = ({
  open,
  onOpenChange,
  task,
  defaultProjectId,
  onSuccess,
}) => {
  const isEditing = Boolean(task);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      projectId: defaultProjectId || '',
      name: '',
      description: '',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: '',
    },
  });

  // Load projects for project selector dropdown
  useEffect(() => {
    if (open) {
      setIsLoadingProjects(true);
      getProjects()
        .then((data) => setProjects(data))
        .catch(() => {})
        .finally(() => setIsLoadingProjects(false));
    }
  }, [open]);

  useEffect(() => {
    if (task) {
      reset({
        projectId: task.projectId,
        name: task.name,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate || '',
      });
    } else {
      reset({
        projectId: defaultProjectId || '',
        name: '',
        description: '',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: '',
      });
    }
  }, [task, defaultProjectId, reset, open]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (isEditing && task) {
        await updateTask(task.id, {
          name: data.name.trim(),
          description: data.description?.trim() || '',
          priority: data.priority as TaskPriority,
          status: data.status as TaskStatus,
          dueDate: data.dueDate || null,
        });
        toast.success('Task updated.');
      } else {
        await createTask({
          projectId: data.projectId,
          name: data.name.trim(),
          description: data.description?.trim() || '',
          priority: data.priority as TaskPriority,
          status: data.status as TaskStatus,
          dueDate: data.dueDate || null,
        });
        toast.success('Task created.');
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update task details, schedule, or progress.'
              : 'Add a new action item or deliverable to a project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Project selector */}
          <div className="space-y-1.5">
            <label htmlFor="taskProject" className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              id="taskProject"
              {...register('projectId')}
              disabled={isEditing || Boolean(defaultProjectId)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-60"
            >
              <option value="">
                {isLoadingProjects ? 'Loading projects...' : 'Select a project...'}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="text-xs text-red-500">{errors.projectId.message}</p>
            )}
          </div>

          {/* Task Name */}
          <div className="space-y-1.5">
            <label htmlFor="taskName" className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Task Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="taskName"
              placeholder="e.g. Design navigation flow"
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
            <label htmlFor="taskDesc" className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Description
            </label>
            <textarea
              id="taskDesc"
              rows={3}
              placeholder="Detailed notes, criteria, or subtasks..."
              {...register('description')}
              className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:text-slate-100"
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="taskPriority" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Priority
              </label>
              <select
                id="taskPriority"
                {...register('priority')}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="taskStatus" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Status
              </label>
              <select
                id="taskStatus"
                {...register('status')}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label htmlFor="dueDate" className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Due Date
            </label>
            <Input
              id="dueDate"
              type="date"
              {...register('dueDate')}
            />
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
                'Create Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
