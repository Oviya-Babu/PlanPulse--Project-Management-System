import { prisma } from '../lib/prisma';

export interface DashboardMetrics {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  projectsInProgress: number;
  inProgressTasks: number;
}

export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const [
    totalProjects,
    projectsInProgress,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
  ] = await Promise.all([
    // Total projects owned by user
    prisma.project.count({
      where: { ownerId: userId },
    }),
    // Projects in progress owned by user
    prisma.project.count({
      where: {
        ownerId: userId,
        status: 'IN_PROGRESS',
      },
    }),
    // Total tasks under user's projects
    prisma.task.count({
      where: {
        project: { ownerId: userId },
      },
    }),
    // Completed tasks under user's projects
    prisma.task.count({
      where: {
        project: { ownerId: userId },
        status: 'COMPLETED',
      },
    }),
    // Pending tasks under user's projects
    prisma.task.count({
      where: {
        project: { ownerId: userId },
        status: 'PENDING',
      },
    }),
    // In progress tasks under user's projects
    prisma.task.count({
      where: {
        project: { ownerId: userId },
        status: 'IN_PROGRESS',
      },
    }),
  ]);

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    projectsInProgress,
    inProgressTasks,
  };
}
