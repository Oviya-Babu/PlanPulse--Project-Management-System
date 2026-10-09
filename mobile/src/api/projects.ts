import { apiClient } from './client';
import { Project, ProjectStatus } from './types';

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus;
}

export async function fetchProjects(filters?: ProjectFilters): Promise<Project[]> {
  const params: Record<string, string> = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.status) params.status = filters.status;

  const res = await apiClient.get<{ data: Project[] }>('/projects', { params });
  return res.data.data;
}

export async function fetchProjectById(id: string): Promise<Project> {
  const res = await apiClient.get<{ data: Project }>(`/projects/${id}`);
  return res.data.data;
}
