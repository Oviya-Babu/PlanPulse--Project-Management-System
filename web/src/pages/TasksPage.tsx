import React from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export const TasksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organize task backlogs, manage priorities, and track progress.
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </Button>
      </div>

      <Card className="border-dashed border-2 bg-card/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <CheckSquare className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">No tasks found</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-2 mb-6">
            Tasks will appear here once you create a project and assign tasks to it.
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
