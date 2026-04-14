import axios from 'axios';
import type {
  ListParams,
  DeleteParams,
} from './types';

const api = axios.create({
  baseURL: '/api/admin',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export async function adminLogin(
  username: string,
  password: string
): Promise<boolean> {
  const res = await api.post('/login', { username, password });
  if (res.data?.success) {
    return true;
  }
  return false;
}

export interface ProxyResponse {
  responseCode: string;
  responseMessage?: string;
  responseData: Record<string, string>[] | null;
  totalCount?: number;
  headers?: string[];
}

export async function getList(
  controller: string,
  action: string,
  params: ListParams
): Promise<ProxyResponse> {
  const res = await api.post('/proxy', {
    endpoint: `${controller}/${action}`,
    data: params,
  });
  return res.data;
}

export async function deleteEntity(
  params: DeleteParams
): Promise<ProxyResponse> {
  const res = await api.post('/proxy', {
    endpoint: 'Common/Delete',
    data: params,
  });
  return res.data;
}

export async function getDashboard(): Promise<ProxyResponse> {
  const res = await api.get('/proxy?endpoint=Home/GetDashboardData');
  return res.data;
}

export interface DashboardMetrics {
  totalIndividualUsers: number;
  totalCompanyUsers: number;
  totalSubscriptions: number;
  totalPlans: number;
  totalFaqs: number;
  totalDisputes: number;
  totalSkills: number;
  totalCategories: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await api.get('/metrics');
  return res.data as DashboardMetrics;
}

export default api;
