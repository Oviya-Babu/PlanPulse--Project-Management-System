import { apiClient } from './client';
import { DashboardMetrics } from './types';

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await apiClient.get<{ data: DashboardMetrics }>('/dashboard');
  return res.data.data;
}
