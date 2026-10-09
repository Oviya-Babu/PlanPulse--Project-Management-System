import prisma from '../lib/prisma';
import { ProjectStatus, TaskStatus } from '@prisma/client';
import { CreateProjectInput, UpdateProjectInput } from '../schemas/project.schemas';
import { NotFoundError, ValidationError } from '../errors';
import { escapeSearchTerm } from '../lib/search';

export interface ProjectDto {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  completedTaskCount: number;
}

function formatDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

function toProjectDto(
  project: {
    id: string;
    name: string;
    description: string;
    status: ProjectStatus;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    tasks?: { status: TaskStatus }[];
    _count?: { tasks: number };
  },
  completedTaskCount?: number
): ProjectDto {
  let totalTasks = 0;
  let completedTasks = 0;

  if (project.tasks) {
    totalTasks = project.tasks.length;
    completedTasks = project.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  } else if (project._count) {
    totalTasks = project._count.tasks;
    completedTasks = completedTaskCount ?? 0;
  }

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    startDate: formatDate(project.startDate),
    endDate: formatDate(project.endDate),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    taskCount: totalTasks,
    completedTaskCount: completedTasks,
  };
}

export async function listProjects(
  ownerId: string,
  filters?: { search?: string; status?: ProjectStatus }
): Promise<ProjectDto[]> {
  const whereClause: {
    ownerId: string;
    status?: ProjectStatus;
    name?: { contains: string; mode: 'insensitive' };
  } = { ownerId };

  if (filters?.status) {
    whereClause.status = filters.status;
  }

  if (filters?.search && filters.search.trim().length > 0) {
    whereClause.name = {
      contains: escapeSearchTerm(filters.search.trim()),
      mode: 'insensitive',
    };
  }

  const projects = await prisma.project.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      tasks: {
        select: { status: true },
      },
    },
  });

  return projects.map((p) => toProjectDto(p));
}

export async function getProjectById(ownerId: string, id: string): Promise<ProjectDto> {
  const project = await prisma.project.findFirst({
    where: { id, ownerId },
    include: {
      tasks: {
        select: { status: true },
      },
    },
  });

  if (!project) {
    throw new NotFoundError('PROJECT_NOT_FOUND', 'Project not found.');
  }

  return toProjectDto(project);
}

export async function createProject(
  ownerId: string,
  data: CreateProjectInput
): Promise<ProjectDto> {
  const project = await prisma.project.create({
    data: {
      ownerId,
      name: data.name,
      description: data.description ?? '',
      status: data.status ?? ProjectStatus.NOT_STARTED,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    include: {
      tasks: {
        select: { status: true },
      },
    },
  });

  return toProjectDto(project);
}

export async function updateProject(
  ownerId: string,
  id: string,
  data: UpdateProjectInput
): Promise<ProjectDto> {
  // First check project existence with ownership predicate
  const existing = await prisma.project.findFirst({
    where: { id, ownerId },
  });

  if (!existing) {
    throw new NotFoundError('PROJECT_NOT_FOUND', 'Project not found.');
  }

  // Validate merged date ordering if dates are being modified
  const mergedStart =
    data.startDate !== undefined
      ? data.startDate ? new Date(data.startDate) : null
      : existing.startDate;
  const mergedEnd =
    data.endDate !== undefined
      ? data.endDate ? new Date(data.endDate) : null
      : existing.endDate;

  if (mergedStart && mergedEnd && mergedEnd < mergedStart) {
    throw new ValidationError('End date must be on or after start date.', [
      { field: 'endDate', message: 'End date must be on or after start date.' },
    ]);
  }

  const updateData: {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    startDate?: Date | null;
    endDate?: Date | null;
  } = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.startDate !== undefined) {
    updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  }
  if (data.endDate !== undefined) {
    updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  }

  const updated = await prisma.project.update({
    where: { id },
    data: updateData,
    include: {
      tasks: {
        select: { status: true },
      },
    },
  });

  return toProjectDto(updated);
}

export async function deleteProject(ownerId: string, id: string): Promise<void> {
  const existing = await prisma.project.findFirst({
    where: { id, ownerId },
  });

  if (!existing) {
    throw new NotFoundError('PROJECT_NOT_FOUND', 'Project not found.');
  }

  await prisma.project.delete({
    where: { id },
  });
}
