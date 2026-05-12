import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface FollowUpClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface FollowUpInvoice {
  id: string;
  invoiceNumber: string | null;
  amount: number;
  dueDate: string;
  status: string;
}

export interface FollowUpAction {
  id: string;
  actionType: string;
  actionDate: string;
  notes: string | null;
  outcome: string | null;
  nextActionDate: string | null;
  dayOfWeek: number | null;
  hourOfDay: number | null;
  ledToPayment: boolean;
  daysToPayment: number | null;
  client: FollowUpClient | null;
  invoice: FollowUpInvoice | null;
  createdBy: { id: string; fullName: string | null; email: string } | null;
  createdAt: string;
}

export interface FollowUpPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FollowUpActionsResponse {
  actions: FollowUpAction[];
  pagination: FollowUpPagination;
}

export interface FollowUpFilters {
  invoiceId?: string;
  clientId?: string;
  actionType?: string;
  outcome?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

async function fetchFollowUpActions(filters: FollowUpFilters): Promise<FollowUpActionsResponse> {
  const params = new URLSearchParams();
  if (filters.invoiceId) params.set("invoiceId", filters.invoiceId);
  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.actionType) params.set("actionType", filters.actionType);
  if (filters.outcome) params.set("outcome", filters.outcome);
  if (filters.page) params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

  const response = await fetch(`/api/follow-up-actions?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch follow-up actions");
  }
  return response.json();
}

export function useFollowUpActions(filters: FollowUpFilters = {}) {
  return useQuery({
    queryKey: ["follow-up-actions", filters],
    queryFn: () => fetchFollowUpActions(filters),
  });
}

export interface CreateFollowUpParams {
  invoiceId?: string;
  clientId?: string;
  actionType: "email" | "call" | "meeting" | "escalation" | "sms";
  actionDate?: string;
  notes?: string;
  outcome?: string;
  nextActionDate?: string | null;
}

async function createFollowUpAction(params: CreateFollowUpParams): Promise<FollowUpAction> {
  const response = await fetch("/api/follow-up-actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error("Failed to create follow-up action");
  }
  return response.json();
}

export function useCreateFollowUpAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFollowUpAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-up-actions"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["client"] });
    },
  });
}

export interface UpdateFollowUpParams {
  id: string;
  notes?: string;
  outcome?: string;
  nextActionDate?: string | null;
  ledToPayment?: boolean;
  daysToPayment?: number;
}

async function updateFollowUpAction(params: UpdateFollowUpParams): Promise<FollowUpAction> {
  const { id, ...data } = params;
  const response = await fetch(`/api/follow-up-actions?id=${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update follow-up action");
  }
  return response.json();
}

export function useUpdateFollowUpAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFollowUpAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-up-actions"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["client"] });
    },
  });
}

async function deleteFollowUpAction(id: string): Promise<{ success: boolean; id: string }> {
  const response = await fetch(`/api/follow-up-actions?id=${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete follow-up action");
  }
  return response.json();
}

export function useDeleteFollowUpAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFollowUpAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-up-actions"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["client"] });
    },
  });
}
