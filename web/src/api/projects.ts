import { api } from '../lib/api';
import { Project, ProjectStatus } from '../types';

export interface CreateProjectPayload {
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus;
}

export async function getProjects(filters?: ProjectFilters): Promise<Project[]> {
  const params: Record<string, string> = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.status) params.status = filters.status;

  const res = await api.get<{ data: Project[] }>('/projects', { params });
  return res.data.data;
}

export async function getProjectById(id: string): Promise<Project> {
  const res = await api.get<{ data: Project }>(`/projects/${id}`);
  return res.data.data;
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const res = await api.post<{ data: Project }>('/projects', payload);
  return res.data.data;
}

export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<Project> {
  const res = await api.put<{ data: Project }>(`/projects/${id}`, payload);
  return res.data.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}
