'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getList, deleteEntity, getDashboard, getDashboardMetrics, ProxyResponse } from '../client';
import type { DashboardMetrics } from '../client';
import type { AdminEndpointConfig, DeleteParams } from '../types';

export function useAdminList(
  config: AdminEndpointConfig,
  page: number,
  search: string
) {
  return useQuery<ProxyResponse>({
    queryKey: ['admin-list', config.controller, page, search],
    queryFn: () =>
      getList(config.controller, config.getAction, {
        PageNumber: page,
        SearchText: search || undefined,
      }),
    placeholderData: (prev) => prev,
  });
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: DeleteParams) => deleteEntity(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-list'] });
    },
  });
}

export function useDashboardData() {
  return useQuery<ProxyResponse>({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: 60_000,
  });
}

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: getDashboardMetrics,
    staleTime: 60_000,
  });
}

export function useUserDetail(id: string | number) {
  return useQuery({
    queryKey: ['user-detail', String(id)],
    queryFn: async () => {
      const res = await fetch(`/api/admin/user-detail?id=${id}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}
