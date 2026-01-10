import { useQuery } from "@tanstack/react-query";

export interface InvoiceClient {
  id: string;
  name: string;
  email: string | null;
  paymentBehaviorTier: string | null;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  date: string;
  method: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  client: InvoiceClient | null;
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  status: string;
  daysOverdue: number;
  recoveryScore: number | null;
  predictedPaymentDate: string | null;
  recommendedAction: string | null;
  payments: InvoicePayment[];
}

export interface InvoicePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  pagination: InvoicePagination;
}

export interface InvoicesFilters {
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

async function fetchInvoices(filters: InvoicesFilters): Promise<InvoicesResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.page) params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

  const response = await fetch(`/api/invoices?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch invoices");
  }
  return response.json();
}

export function useInvoices(filters: InvoicesFilters = {}) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => fetchInvoices(filters),
  });
}
