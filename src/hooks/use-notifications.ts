import { useQuery } from "@tanstack/react-query";

export interface NotificationClient {
  id: string;
  name: string;
  initials: string;
}

export interface Notification {
  id: string;
  type: "overdue" | "payment" | "reminder" | "alert" | "recommendation";
  title: string;
  description: string;
  timestamp: string;
  timestampRaw: string;
  read: boolean;
  client?: NotificationClient;
  amount?: number;
  invoiceId?: string;
  invoiceNumber?: string;
  recommendationId?: string;
}

export interface NotificationCounts {
  all: number;
  unread: number;
  overdue: number;
  payment: number;
  reminder: number;
  alert: number;
  recommendation: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  counts: NotificationCounts;
}

export interface NotificationsFilters {
  type?: string;
  limit?: number;
}

async function fetchNotifications(filters: NotificationsFilters): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.limit) params.set("limit", filters.limit.toString());

  const response = await fetch(`/api/notifications?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return response.json();
}

export function useNotifications(filters: NotificationsFilters = {}) {
  return useQuery({
    queryKey: ["notifications", filters],
    queryFn: () => fetchNotifications(filters),
    refetchInterval: 60000, // Refetch every minute
  });
}
