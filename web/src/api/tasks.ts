import { api } from '../lib/api';
import { Task, TaskPriority, TaskStatus } from '../types';

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

export interface TaskFilters {
  projectId?: string;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  const params: Record<string, string> = {};
  if (filters?.projectId) params.projectId = filters.projectId;
  if (filters?.search) params.search = filters.search;
  if (filters?.status) params.status = filters.status;
  if (filters?.priority) params.priority = filters.priority;

  const res = await api.get<{ data: Task[] }>('/tasks', { params });
  return res.data.data;
}

export async function getTaskById(id: string): Promise<Task> {
  const res = await api.get<{ data: Task }>(`/tasks/${id}`);
  return res.data.data;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const res = await api.post<{ data: Task }>('/tasks', payload);
  return res.data.data;
}

export async function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  const res = await api.put<{ data: Task }>(`/tasks/${id}`, payload);
  return res.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}
