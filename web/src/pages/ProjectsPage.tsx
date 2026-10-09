import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Folder, Calendar, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorState } from '../components/ui/error-state';
import { ProjectDialog } from '../components/projects/ProjectDialog';
import { DeleteProjectDialog } from '../components/projects/DeleteProjectDialog';
import { Project, ProjectStatus } from '../types';
import { getProjects } from '../api/projects';
import { getApiErrorMessage } from '../lib/api';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters synced with URL search params (AC-SRCH-06)
  const search = searchParams.get('search') || '';
  const statusFilter = (searchParams.get('status') as ProjectStatus | 'ALL') || 'ALL';

  const updateFilters = (newSearch: string, newStatus: string) => {
    const next: Record<string, string> = {};
    if (newSearch.trim()) next.search = newSearch;
    if (newStatus && newStatus !== 'ALL') next.status = newStatus;
    setSearchParams(next, { replace: true });
  };

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProjects({
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setProjects(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setDeletingProject(project);
  };

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

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start && !end) return 'No dates scheduled';
    if (start && !end) return `From ${start}`;
    if (!start && end) return `Due ${end}`;
    return `${start} – ${end}`;
  };

  const isFiltered = Boolean(search.trim() || statusFilter !== 'ALL');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Projects
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create, manage and organize all your projects and deliverables.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => updateFilters(e.target.value, statusFilter)}
            placeholder="Search projects by name..."
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => updateFilters(search, status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              {status === 'ALL'
                ? 'All'
                : status === 'NOT_STARTED'
                ? 'Not Started'
                : status === 'IN_PROGRESS'
                ? 'In Progress'
                : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-xl border border-slate-200 p-5 shadow-sm dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-10 w-full" />
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load projects."
          message={error}
          onRetry={fetchProjects}
        />
      ) : projects.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={Folder}
            title="No projects match your search or filters."
            description="Try adjusting your search query or status filter to see other projects."
            actionLabel="Clear Filters"
            onAction={() => updateFilters('', 'ALL')}
          />
        ) : (
          <EmptyState
            icon={Folder}
            title="You don't have any projects yet."
            description="Create your first project to start organizing tasks, tracking progress, and hitting deadlines."
            actionLabel="Create Project"
            onAction={handleOpenCreate}
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const taskCount = project.taskCount ?? 0;
            const completedCount = project.completedTaskCount ?? 0;
            const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 cursor-pointer"
              >
                <div>
                  {/* Top Bar: Status & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    {getStatusBadge(project.status)}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        onClick={(e) => handleOpenEdit(e, project)}
                        title="Edit Project"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                        onClick={(e) => handleOpenDelete(e, project)}
                        title="Delete Project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Project Name */}
                  <h3 className="mt-3 text-lg font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {project.name}
                  </h3>

                  {/* Description */}
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                {/* Bottom Details */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateRange(project.startDate, project.endDate)}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {completedCount}/{taskCount} tasks ({progress}%)
                    </span>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        project.status === 'COMPLETED'
                          ? 'bg-emerald-500'
                          : 'bg-indigo-600 dark:bg-indigo-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Create/Edit Dialog */}
      <ProjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        project={editingProject}
        onSuccess={fetchProjects}
      />

      {/* Project Delete Dialog */}
      <DeleteProjectDialog
        open={Boolean(deletingProject)}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        project={deletingProject}
        onSuccess={fetchProjects}
      />
    </div>
  );
};
