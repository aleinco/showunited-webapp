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
  const endpoints = [
    { key: 'totalIndividualUsers', controller: 'IndividualUser', action: 'GetIndividualUserData' },
    { key: 'totalCompanyUsers', controller: 'CompanyUser', action: 'GetCompanyUserData' },
    { key: 'totalSubscriptions', controller: 'UserSubscription', action: 'GetUserSubscriptionData' },
    { key: 'totalPlans', controller: 'SubscriptionPlan', action: 'GetSubscriptionPlanData' },
    { key: 'totalFaqs', controller: 'FAQ', action: 'GetFAQData' },
    { key: 'totalDisputes', controller: 'UserDispute', action: 'GetUserDisputeData' },
    { key: 'totalSkills', controller: 'Skill', action: 'GetSkillData' },
    { key: 'totalCategories', controller: 'IndividualCategory', action: 'GetIndividualCategoryData' },
  ];

  const results = await Promise.allSettled(
    endpoints.map(async (ep) => {
      const res = await api.post('/proxy', {
        endpoint: `${ep.controller}/${ep.action}`,
        data: { PageNumber: 1 },
      });
      return { key: ep.key, count: res.data?.totalCount || 0 };
    })
  );

  const metrics: any = {};
  for (const r of results) {
    if (r.status === 'fulfilled') {
      metrics[r.value.key] = r.value.count;
    }
  }
  return metrics as DashboardMetrics;
}

export default api;
