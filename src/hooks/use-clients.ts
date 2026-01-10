import { useQuery } from "@tanstack/react-query";

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  paymentBehaviorScore: number | null;
  paymentBehaviorTier: string | null;
  avgDaysToPay: number | null;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  invoiceCount: number;
  openInvoices: number;
  openInvoicesTotal: number;
}

export interface ClientPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ClientsResponse {
  clients: Client[];
  pagination: ClientPagination;
}

export interface ClientsFilters {
  tier?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

async function fetchClients(filters: ClientsFilters): Promise<ClientsResponse> {
  const params = new URLSearchParams();
  if (filters.tier) params.set("tier", filters.tier);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

  const response = await fetch(`/api/clients?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch clients");
  }
  return response.json();
}

export function useClients(filters: ClientsFilters = {}) {
  return useQuery({
    queryKey: ["clients", filters],
    queryFn: () => fetchClients(filters),
  });
}
