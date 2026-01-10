import { useQuery } from "@tanstack/react-query";

export interface DashboardKPIs {
  totalReceivables: number;
  totalOverdue: number;
  overdueCount: number;
  collectionRate: number;
}

export interface AgingBuckets {
  current: number;
  overdue30: number;
  overdue60: number;
  overdue90Plus: number;
}

export interface AtRiskInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  daysOverdue: number;
  recoveryScore: number;
}

export interface RecentPayment {
  id: string;
  amount: number;
  date: string;
  clientName: string;
  invoiceNumber: string;
}

export interface ClientsByTier {
  A: number;
  B: number;
  C: number;
  D: number;
  unscored: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  aging: AgingBuckets;
  atRiskInvoices: AtRiskInvoice[];
  recentPayments: RecentPayment[];
  clientsByTier: ClientsByTier;
}

async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }
  return response.json();
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });
}
