import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface RecommendationClient {
  id: string;
  name: string;
  email: string | null;
  paymentBehaviorTier: string | null;
}

export interface RecommendationInvoice {
  id: string;
  invoiceNumber: string | null;
  amount: number;
  dueDate: string;
  status: string;
}

export interface Recommendation {
  id: string;
  type: string;
  text: string;
  confidence: number | null;
  reasoning: string | null;
  status: string;
  client: RecommendationClient | null;
  invoice: RecommendationInvoice | null;
  actionedAt: string | null;
  actionedBy: { id: string; fullName: string | null; email: string } | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface RecommendationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  pagination: RecommendationPagination;
}

export interface RecommendationsFilters {
  status?: string;
  clientId?: string;
  invoiceId?: string;
  page?: number;
  limit?: number;
}

async function fetchRecommendations(filters: RecommendationsFilters): Promise<RecommendationsResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.invoiceId) params.set("invoiceId", filters.invoiceId);
  if (filters.page) params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());

  const response = await fetch(`/api/recommendations?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch recommendations");
  }
  return response.json();
}

export function useRecommendations(filters: RecommendationsFilters = {}) {
  return useQuery({
    queryKey: ["recommendations", filters],
    queryFn: () => fetchRecommendations(filters),
  });
}

export interface GenerateRecommendationsParams {
  clientId?: string;
  invoiceId?: string;
  limit?: number;
}

async function generateRecommendations(params: GenerateRecommendationsParams): Promise<RecommendationsResponse> {
  const response = await fetch("/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error("Failed to generate recommendations");
  }
  return response.json();
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateRecommendations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}

async function updateRecommendationStatus(
  id: string,
  status: "accepted" | "dismissed"
): Promise<{ id: string; status: string; actionedAt: string }> {
  const response = await fetch("/api/recommendations", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
  if (!response.ok) {
    throw new Error("Failed to update recommendation");
  }
  return response.json();
}

export function useUpdateRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "dismissed" }) =>
      updateRecommendationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["client"] });
    },
  });
}
