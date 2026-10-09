import prisma from '../lib/prisma';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { CreateTaskInput, UpdateTaskInput, TaskQueryInput } from '../schemas/task.schemas';
import { NotFoundError } from '../errors';

export interface TaskDto {
  id: string;
  projectId: string;
  name: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
  };
}

function formatDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

function toTaskDto(task: {
  id: string;
  projectId: string;
  name: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    name: string;
  };
}): TaskDto {
  return {
    id: task.id,
    projectId: task.projectId,
    name: task.name,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: formatDate(task.dueDate),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    project: {
      id: task.project.id,
      name: task.project.name,
    },
  };
}

export async function listTasks(
  ownerId: string,
  filters?: TaskQueryInput
): Promise<TaskDto[]> {
  // If filtering by projectId, verify project belongs to owner (AC-TASK-09)
  if (filters?.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: filters.projectId, ownerId },
    });
    if (!project) {
      throw new NotFoundError('PROJECT_NOT_FOUND', 'Project not found.');
    }
  }

  const whereClause: {
    project: { ownerId: string; id?: string };
    status?: TaskStatus;
    priority?: TaskPriority;
    name?: { contains: string; mode: 'insensitive' };
  } = {
    project: {
      ownerId,
      ...(filters?.projectId ? { id: filters.projectId } : {}),
    },
  };

  if (filters?.status) {
    whereClause.status = filters.status;
  }

  if (filters?.priority) {
    whereClause.priority = filters.priority;
  }

  if (filters?.search && filters.search.trim().length > 0) {
    whereClause.name = {
      contains: filters.search.trim(),
      mode: 'insensitive',
    };
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  return tasks.map(toTaskDto);
}

export async function getTaskById(ownerId: string, id: string): Promise<TaskDto> {
  const task = await prisma.task.findFirst({
    where: {
      id,
      project: { ownerId },
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  if (!task) {
    throw new NotFoundError('TASK_NOT_FOUND', 'Task not found.');
  }

  return toTaskDto(task);
}

export async function createTask(
  ownerId: string,
  data: CreateTaskInput
): Promise<TaskDto> {
  // Verify parent project ownership before creating (AC-TASK-02)
  const project = await prisma.project.findFirst({
    where: { id: data.projectId, ownerId },
  });

  if (!project) {
    throw new NotFoundError('PROJECT_NOT_FOUND', 'Project not found.');
  }

  const task = await prisma.task.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      description: data.description ?? '',
      priority: data.priority ?? TaskPriority.MEDIUM,
      status: data.status ?? TaskStatus.PENDING,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  return toTaskDto(task);
}

export async function updateTask(
  ownerId: string,
  id: string,
  data: UpdateTaskInput
): Promise<TaskDto> {
  // Verify task existence and parent project ownership (AC-TASK-05)
  const existing = await prisma.task.findFirst({
    where: {
      id,
      project: { ownerId },
    },
  });

  if (!existing) {
    throw new NotFoundError('TASK_NOT_FOUND', 'Task not found.');
  }

  const updateData: {
    name?: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: Date | null;
  } = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }

  const updated = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  return toTaskDto(updated);
}

export async function deleteTask(ownerId: string, id: string): Promise<void> {
  const existing = await prisma.task.findFirst({
    where: {
      id,
      project: { ownerId },
    },
  });

  if (!existing) {
    throw new NotFoundError('TASK_NOT_FOUND', 'Task not found.');
  }

  await prisma.task.delete({
    where: { id },
  });
}
