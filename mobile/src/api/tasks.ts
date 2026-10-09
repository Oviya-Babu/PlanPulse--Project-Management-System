import { apiClient } from './client';
import { Task, TaskPriority, TaskStatus } from './types';

export interface TaskFilters {
  projectId?: string;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface CreateTaskPayload {
  projectId: string;
  name: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
}

export interface UpdateTaskPayload {
  name?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
}

export async function fetchTasks(filters?: TaskFilters): Promise<Task[]> {
  const params: Record<string, string> = {};
  if (filters?.projectId) params.projectId = filters.projectId;
  if (filters?.search) params.search = filters.search;
  if (filters?.status) params.status = filters.status;
  if (filters?.priority) params.priority = filters.priority;

  const res = await apiClient.get<{ data: Task[] }>('/tasks', { params });
  return res.data.data;
}

export async function fetchTaskById(id: string): Promise<Task> {
  const res = await apiClient.get<{ data: Task }>(`/tasks/${id}`);
  return res.data.data;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const res = await apiClient.post<{ data: Task }>('/tasks', payload);
  return res.data.data;
}

export async function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  const res = await apiClient.put<{ data: Task }>(`/tasks/${id}`, payload);
  return res.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}
