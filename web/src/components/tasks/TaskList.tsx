import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Calendar,
  Check,
  Edit2,
  Trash2,
  AlertTriangle,
  Folder,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { updateTask } from '../../api/tasks';
import { getApiErrorMessage } from '../../lib/api';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  hideProjectTag?: boolean;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onTaskUpdated: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading,
  hideProjectTag = false,
  onEditTask,
  onDeleteTask,
  onTaskUpdated,
}) => {
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const isOverdue = (dueDate: string | null, status: TaskStatus) => {
    if (!dueDate || status === 'COMPLETED') return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      setUpdatingTaskId(task.id);
      const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await updateTask(task.id, { status: newStatus });
      toast.success(newStatus === 'COMPLETED' ? 'Task completed.' : 'Task marked as pending.');
      onTaskUpdated();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'LOW':
        return <Badge variant="low">Low</Badge>;
      case 'MEDIUM':
        return <Badge variant="medium">Medium</Badge>;
      case 'HIGH':
        return <Badge variant="high">High</Badge>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="notStarted">Pending</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="inProgress">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="completed">Completed</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      {tasks.map((task) => {
        const completed = task.status === 'COMPLETED';
        const overdue = isOverdue(task.dueDate, task.status);
        const isUpdating = updatingTaskId === task.id;

        return (
          <div
            key={task.id}
            className={`group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-4 transition-all ${
              completed
                ? 'border-slate-200/60 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-900/40 opacity-75'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 shadow-sm'
            }`}
          >
            {/* Left section: Checkbox + details */}
            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
              {/* Checkbox button */}
              <button
                type="button"
                onClick={() => handleToggleComplete(task)}
                disabled={isUpdating}
                className={`mt-0.5 sm:mt-0 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                  completed
                    ? 'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-600 dark:bg-emerald-600'
                    : 'border-slate-300 hover:border-indigo-500 dark:border-slate-600'
                } ${isUpdating ? 'opacity-50' : ''}`}
                title={completed ? 'Mark pending' : 'Mark completed'}
              >
                {completed ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : null}
              </button>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-semibold truncate ${
                      completed
                        ? 'line-through text-slate-500 dark:text-slate-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {task.name}
                  </span>

                  {/* Project Tag */}
                  {!hideProjectTag && task.projectName ? (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      <Folder className="h-3 w-3" />
                      {task.projectName}
                    </span>
                  ) : null}
                </div>

                {task.description ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {task.description}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Right section: Badges, dates, actions */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pl-8 sm:pl-0">
              <div className="flex items-center gap-2 flex-wrap">
                {getPriorityBadge(task.priority)}
                {getStatusBadge(task.status)}

                {/* Due Date & Overdue Tag */}
                {task.dueDate ? (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      overdue
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                    title={overdue ? 'Overdue' : 'Due date'}
                  >
                    {overdue ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : (
                      <Calendar className="h-3.5 w-3.5" />
                    )}
                    <span>{task.dueDate}</span>
                    {overdue ? <span className="font-bold underline text-[10px]">Overdue</span> : null}
                  </span>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  onClick={() => onEditTask(task)}
                  title="Edit Task"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                  onClick={() => onDeleteTask(task)}
                  title="Delete Task"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
