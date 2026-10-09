import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, CheckSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorState } from '../components/ui/error-state';
import { TaskList } from '../components/tasks/TaskList';
import { TaskDialog } from '../components/tasks/TaskDialog';
import { DeleteTaskDialog } from '../components/tasks/DeleteTaskDialog';
import { Task, TaskPriority, TaskStatus, Project } from '../types';
import { getTasks } from '../api/tasks';
import { getProjects } from '../api/projects';
import { getApiErrorMessage } from '../lib/api';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TaskPriority>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Load projects for project filter dropdown
  useEffect(() => {
    getProjects()
      .then((data) => setProjects(data))
      .catch(() => {});
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTasks({
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        projectId: projectFilter === 'ALL' ? undefined : projectFilter,
      });

      // Map project name onto tasks
      const enriched = data.map((t) => {
        const found = projects.find((p) => p.id === t.projectId);
        return {
          ...t,
          projectName: found ? found.name : undefined,
        };
      });

      setTasks(enriched);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, priorityFilter, projectFilter, projects]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (task: Task) => {
    setDeletingTask(task);
  };

  const isFiltered = Boolean(
    search.trim() ||
      statusFilter !== 'ALL' ||
      priorityFilter !== 'ALL' ||
      projectFilter !== 'ALL'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View, track, and complete all your tasks across all active projects.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by name..."
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | TaskStatus)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | TaskPriority)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          {/* Project filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 max-w-[160px] truncate"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <TaskList
          tasks={[]}
          isLoading={true}
          onEditTask={handleOpenEdit}
          onDeleteTask={handleOpenDelete}
          onTaskUpdated={fetchTasks}
        />
      ) : error ? (
        <ErrorState
          title="Unable to load tasks."
          message={error}
          onRetry={fetchTasks}
        />
      ) : tasks.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks match your search or filters."
            description="Try clearing your filters or search keywords to view other tasks."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearch('');
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
              setProjectFilter('ALL');
            }}
          />
        ) : (
          <EmptyState
            icon={CheckSquare}
            title="You don't have any tasks yet."
            description="Create your first task to start tracking actionable deliverables inside your projects."
            actionLabel="Create Task"
            onAction={handleOpenCreate}
          />
        )
      ) : (
        <TaskList
          tasks={tasks}
          onEditTask={handleOpenEdit}
          onDeleteTask={handleOpenDelete}
          onTaskUpdated={fetchTasks}
        />
      )}

      {/* Task Create/Edit Dialog */}
      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={editingTask}
        onSuccess={fetchTasks}
      />

      {/* Task Delete Confirmation Dialog */}
      <DeleteTaskDialog
        open={Boolean(deletingTask)}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        task={deletingTask}
        onSuccess={fetchTasks}
      />
    </div>
  );
};
