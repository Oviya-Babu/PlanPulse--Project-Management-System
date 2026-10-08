import React from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export const ProjectsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track all your active, planned, and completed projects.
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      <Card className="border-dashed border-2 bg-card/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <FolderKanban className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">No projects found</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-2 mb-6">
            You don't have any projects in your workspace yet.
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Project</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
