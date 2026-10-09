import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  ListTodo,
  Edit2,
  Trash2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ErrorState } from '../components/ui/error-state';
import { EmptyState } from '../components/ui/empty-state';
import { ProjectDialog } from '../components/projects/ProjectDialog';
import { DeleteProjectDialog } from '../components/projects/DeleteProjectDialog';
import { TaskList } from '../components/tasks/TaskList';
import { TaskDialog } from '../components/tasks/TaskDialog';
import { DeleteTaskDialog } from '../components/tasks/DeleteTaskDialog';
import { Project, ProjectStatus, Task } from '../types';
import { getProjectById } from '../api/projects';
import { getTasks } from '../api/tasks';
import { getApiErrorMessage } from '../lib/api';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  // Project dialogs
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Task dialogs
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const fetchProjectData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      setIsNotFound(false);
      const [projData, tasksData] = await Promise.all([
        getProjectById(id),
        getTasks({ projectId: id }),
      ]);
      setProject(projData);
      setTasks(tasksData);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      if (msg.includes('not found') || msg.includes('404')) {
        setIsNotFound(true);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const refreshTasksOnly = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoadingTasks(true);
      const [projData, tasksData] = await Promise.all([
        getProjectById(id),
        getTasks({ projectId: id }),
      ]);
      setProject(projData);
      setTasks(tasksData);
    } catch {
      // Keep existing data on refresh error
    } finally {
      setIsLoadingTasks(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'NOT_STARTED':
        return <Badge variant="notStarted">Not Started</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="inProgress">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="completed">Completed</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="rounded-xl border border-slate-200 p-6 dark:border-slate-800 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project not found.</h2>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          The requested project does not exist or you do not have permission to view it.
        </p>
        <Button onClick={() => navigate('/projects')} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  if (error || !project) {
    return (
      <ErrorState
        title="Unable to load this project."
        message={error || 'An unexpected error occurred.'}
        onRetry={fetchProjectData}
      />
    );
  }

  const taskCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const pendingCount = taskCount - completedCount;
  const progressPercent = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Main Project Card Header */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {project.name}
              </h1>
              {getStatusBadge(project.status)}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl whitespace-pre-wrap">
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Overall Progress</span>
            <span className="font-semibold text-slate-900 dark:text-white">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
          <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ListTodo className="h-4 w-4 text-indigo-500" />
              <span>Total Tasks</span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{taskCount}</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Completed</span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{completedCount}</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span>Pending</span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{pendingCount}</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Schedule</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {project.startDate && project.endDate
                ? `${project.startDate} to ${project.endDate}`
                : project.startDate
                ? `From ${project.startDate}`
                : project.endDate
                ? `Due ${project.endDate}`
                : 'No dates set'}
            </p>
          </div>
        </div>
      </div>

      {/* Tasks Section Header & List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Project Tasks</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deliverables and action items associated with this project.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setIsTaskDialogOpen(true);
            }}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>

        {/* Task list or Empty state */}
        {taskCount === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="This project has no tasks yet."
            description="Create your first task to start organizing deliverables and tracking completion."
            actionLabel="Add Task"
            onAction={() => {
              setEditingTask(null);
              setIsTaskDialogOpen(true);
            }}
          />
        ) : (
          <TaskList
            tasks={tasks}
            isLoading={isLoadingTasks}
            hideProjectTag={true}
            onEditTask={(t) => {
              setEditingTask(t);
              setIsTaskDialogOpen(true);
            }}
            onDeleteTask={(t) => setDeletingTask(t)}
            onTaskUpdated={refreshTasksOnly}
          />
        )}
      </div>

      {/* Project Edit Dialog */}
      <ProjectDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        project={project}
        onSuccess={fetchProjectData}
      />

      {/* Project Delete Dialog */}
      <DeleteProjectDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        project={project}
        onSuccess={() => navigate('/projects')}
      />

      {/* Task Create/Edit Dialog */}
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={editingTask}
        defaultProjectId={project.id}
        onSuccess={refreshTasksOnly}
      />

      {/* Task Delete Dialog */}
      <DeleteTaskDialog
        open={Boolean(deletingTask)}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        task={deletingTask}
        onSuccess={refreshTasksOnly}
      />
    </div>
  );
};
