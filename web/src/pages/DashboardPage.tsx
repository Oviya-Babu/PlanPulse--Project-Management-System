import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Clock,
  ListTodo,
  CheckCircle2,
  PlayCircle,
  Plus,
  RefreshCw,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ErrorState } from '../components/ui/error-state';
import { getDashboardMetrics } from '../api/dashboard';
import { DashboardMetrics } from '../types';
import { getApiErrorMessage } from '../lib/api';
import { ProjectDialog } from '../components/projects/ProjectDialog';
import { TaskDialog } from '../components/tasks/TaskDialog';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState<boolean>(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState<boolean>(false);

  const loadMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Derived stats
  const totalTasks = metrics?.totalTasks ?? 0;
  const completedTasks = metrics?.completedTasks ?? 0;
  const pendingTasks = metrics?.pendingTasks ?? 0;
  const inProgressTasks = metrics?.inProgressTasks ?? Math.max(0, totalTasks - completedTasks - pendingTasks);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalProjects = metrics?.totalProjects ?? 0;
  const projectsInProgress = metrics?.projectsInProgress ?? 0;
  const isBrandNewUser = totalProjects === 0 && totalTasks === 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Workspace Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time project deliverables, milestone status, and productivity metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMetrics}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTaskDialogOpen(true)}
            disabled={totalProjects === 0}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsProjectDialogOpen(true)}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && !isLoading ? (
        <ErrorState
          title="Failed to load dashboard"
          message={error}
          onRetry={loadMetrics}
        />
      ) : null}

      {/* 5 Core Metrics Cards in exact PRD §8D order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Projects */}
        <Card className="hover:shadow-md transition-all border-l-4 border-l-primary bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Projects
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FolderKanban className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-extrabold text-foreground tracking-tight">
                {totalProjects}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>All owned projects</span>
              <Link to="/projects" className="text-primary hover:underline font-medium">
                View &rarr;
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* 2. Total Tasks */}
        <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500 bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Tasks
            </CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <ListTodo className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-extrabold text-foreground tracking-tight">
                {totalTasks}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
              <span>Across all projects</span>
              <Link to="/tasks" className="text-blue-500 hover:underline font-medium">
                View &rarr;
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* 3. Completed Tasks */}
        <Card className="hover:shadow-md transition-all border-l-4 border-l-emerald-500 bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Completed Tasks
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {completedTasks}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {totalTasks > 0 ? `${completionRate}% completed` : 'No tasks recorded'}
            </p>
          </CardContent>
        </Card>

        {/* 4. Pending Tasks */}
        <Card className="hover:shadow-md transition-all border-l-4 border-l-amber-500 bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Tasks
            </CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                {pendingTasks}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Awaiting execution</p>
          </CardContent>
        </Card>

        {/* 5. Projects In Progress */}
        <Card className="hover:shadow-md transition-all border-l-4 border-l-indigo-500 bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Projects In Progress
            </CardTitle>
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <PlayCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
                {projectsInProgress}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Active development</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Breakdown Section (PRD §12.3 Status Bar) */}
      {!isLoading && !isBrandNewUser ? (
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Task Execution & Progress Bar
                </CardTitle>
                <CardDescription>
                  Proportional distribution of deliverables in your workspace
                </CardDescription>
              </div>
              <Badge variant="outline" className="self-start sm:self-auto font-mono text-xs">
                {completionRate}% Overall Completion
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Multi-segment progress bar */}
            <div className="h-4 w-full bg-secondary rounded-full overflow-hidden flex">
              {totalTasks > 0 ? (
                <>
                  <div
                    style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                    className="bg-emerald-500 h-full transition-all duration-500"
                    title={`Completed: ${completedTasks}`}
                  />
                  <div
                    style={{ width: `${(inProgressTasks / totalTasks) * 100}%` }}
                    className="bg-indigo-500 h-full transition-all duration-500"
                    title={`In Progress: ${inProgressTasks}`}
                  />
                  <div
                    style={{ width: `${(pendingTasks / totalTasks) * 100}%` }}
                    className="bg-amber-500 h-full transition-all duration-500"
                    title={`Pending: ${pendingTasks}`}
                  />
                </>
              ) : (
                <div className="w-full bg-muted h-full" />
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-muted-foreground font-medium">Completed:</span>
                  <span className="font-bold text-foreground">{completedTasks}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-indigo-500 inline-block" />
                  <span className="text-muted-foreground font-medium">In Progress:</span>
                  <span className="font-bold text-foreground">{inProgressTasks}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
                  <span className="text-muted-foreground font-medium">Pending:</span>
                  <span className="font-bold text-foreground">{pendingTasks}</span>
                </div>
              </div>
              <div className="text-muted-foreground">
                Total Tracked: <span className="font-bold text-foreground">{totalTasks}</span> tasks
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Brand New User Onboarding Empty State (AC-DASH-03) */}
      {!isLoading && isBrandNewUser ? (
        <Card className="border-dashed border-2 bg-card/60 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <FolderKanban className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Welcome to PlanPulse!</h2>
            <p className="text-sm text-muted-foreground max-w-md mt-2 mb-6 leading-relaxed">
              You don't have any projects yet. Create your first project to organize work, assign tasks, and track real-time delivery milestones.
            </p>
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsProjectDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Create Your First Project</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Quick Navigation Cards */}
      {!isLoading && !isBrandNewUser ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-primary" />
                  Project Workspace
                </span>
                <Link to="/projects">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <span>Manage</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardTitle>
              <CardDescription>
                Organize projects with start and end schedules, descriptions, and completion metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                <span className="text-sm font-medium">Active Projects</span>
                <Badge variant="inProgress">{projectsInProgress} in progress</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-blue-500" />
                  Deliverables & Tasks
                </span>
                <Link to="/tasks">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <span>Manage</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardTitle>
              <CardDescription>
                Track deliverables with priority tags, status updates, and due dates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                <span className="text-sm font-medium">Pending Action Items</span>
                <Badge variant="secondary">{pendingTasks} pending</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Project Modal */}
      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        onSuccess={loadMetrics}
      />

      {/* Task Modal */}
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSuccess={loadMetrics}
      />
    </div>
  );
};
