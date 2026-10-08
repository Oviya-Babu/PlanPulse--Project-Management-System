import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  ListTodo,
  CheckCheck,
  Server,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { api, getApiErrorMessage } from '../lib/api';
import { HealthResponse } from '../types';

export const DashboardPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setHealthLoading(true);
        const res = await api.get<HealthResponse>('/health');
        setHealth(res.data);
        setHealthError(null);
      } catch (err) {
        setHealthError(getApiErrorMessage(err));
      } finally {
        setHealthLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome to PlanPulse. Overview of your workspace and real-time backend connection.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Health Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card shadow-sm text-xs">
            <Server className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">Backend:</span>
            {healthLoading ? (
              <span className="text-muted-foreground animate-pulse">Checking...</span>
            ) : health?.status === 'ok' ? (
              <Badge variant="completed" className="px-2 py-0">
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="px-2 py-0">
                {healthError || 'Disconnected'}
              </Badge>
            )}
          </div>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* 5 Core Metrics Cards (PRD §8D order) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Projects */}
        <Card className="hover:shadow-md transition-all border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">All managed projects</p>
          </CardContent>
        </Card>

        {/* 2. Total Tasks */}
        <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Tasks
            </CardTitle>
            <ListTodo className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">Assigned across projects</p>
          </CardContent>
        </Card>

        {/* 3. Completed Tasks */}
        <Card className="hover:shadow-md transition-all border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Completed Tasks
            </CardTitle>
            <CheckCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">Marked as completed</p>
          </CardContent>
        </Card>

        {/* 4. Pending Tasks */}
        <Card className="hover:shadow-md transition-all border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pending Tasks
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
          </CardContent>
        </Card>

        {/* 5. Projects In Progress */}
        <Card className="hover:shadow-md transition-all border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Projects In Progress
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State Banner (AC-UI-03, §12.5) */}
      <Card className="border-dashed border-2 bg-card/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <FolderKanban className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">No projects created yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-2 mb-6">
            Get started by creating your first project to organize your team workflows, track milestones, and manage tasks.
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create First Project</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
