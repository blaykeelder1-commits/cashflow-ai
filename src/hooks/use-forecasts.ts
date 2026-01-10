import { useQuery } from "@tanstack/react-query";

export interface ForecastDataPoint {
  date: string;
  predictedInflow: number;
  invoicePayments: number;
  baselinePayments: number;
  cumulative: number;
  confidence: number;
}

export interface ForecastSummary {
  totalPredicted: number;
  averageDaily: number;
  historicalDailyAverage: number;
  outstandingInvoices: number;
  totalOutstanding: number;
}

export interface CashGap {
  date: string;
  expectedShortfall: number;
}

export interface ForecastsResponse {
  forecast: ForecastDataPoint[];
  summary: ForecastSummary;
  cashGaps: CashGap[];
  confidenceLevel: "low" | "medium";
}

async function fetchForecasts(days: number): Promise<ForecastsResponse> {
  const response = await fetch(`/api/forecasts?days=${days}`);
  if (!response.ok) {
    throw new Error("Failed to fetch forecasts");
  }
  return response.json();
}

export function useForecasts(days: number = 30) {
  return useQuery({
    queryKey: ["forecasts", days],
    queryFn: () => fetchForecasts(days),
  });
}
