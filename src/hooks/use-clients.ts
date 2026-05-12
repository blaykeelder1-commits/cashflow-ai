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

// Individual client detail types
export interface ClientInvoice {
  id: string;
  number: string | null;
  amount: number;
  amountPaid: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
}

export interface FollowUpAction {
  id: string;
  actionType: string;
  actionDate: string;
  notes: string | null;
  outcome: string | null;
  nextActionDate: string | null;
  createdBy: { id: string; fullName: string | null } | null;
  ledToPayment: boolean;
}

export interface Recommendation {
  id: string;
  type: string;
  text: string;
  confidence: number | null;
  reasoning: string | null;
}

export interface PaymentPatterns {
  onTime: number;
  late1to15: number;
  late16to30: number;
  late30plus: number;
}

export interface ClientStats {
  totalReceivables: number;
  overdueAmount: number;
  averagePaymentDays: number;
  lifetimeValue: number;
  invoiceCount: number;
  onTimePaymentRate: number;
}

export interface ClientDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  industry: string | null;
  initials: string;
  paymentBehaviorScore: number | null;
  paymentBehaviorTier: string | null;
  avgDaysToPay: number | null;
  riskLevel: "low" | "medium" | "high";
  bestContactDay: string | null;
  bestContactHour: number | null;
  stats: ClientStats;
  invoices: ClientInvoice[];
  paymentPatterns: PaymentPatterns;
  followUpActions: FollowUpAction[];
  recommendations: Recommendation[];
}

async function fetchClient(id: string): Promise<ClientDetail> {
  const response = await fetch(`/api/clients/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch client");
  }
  return response.json();
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: () => fetchClient(id),
    enabled: !!id,
  });
}
