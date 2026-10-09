import { api } from '../lib/api';
import { DashboardMetrics } from '../types';

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await api.get<{ data: DashboardMetrics }>('/dashboard');
  return res.data.data;
}
