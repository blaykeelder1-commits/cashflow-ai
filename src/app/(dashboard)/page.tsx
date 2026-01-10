"use client";

import { DollarSign, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useDashboard } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function KPICardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Failed to load dashboard data. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your cash flow overview and key metrics at a glance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : data ? (
          <>
            <KPICard
              title="Total Receivables"
              value={formatCurrency(data.kpis.totalReceivables)}
              icon={DollarSign}
            />
            <KPICard
              title="Overdue Amount"
              value={formatCurrency(data.kpis.totalOverdue)}
              change={`${data.kpis.overdueCount} invoices`}
              changeType={data.kpis.overdueCount > 0 ? "negative" : "neutral"}
              icon={AlertTriangle}
            />
            <KPICard
              title="Collection Rate"
              value={`${data.kpis.collectionRate.toFixed(1)}%`}
              changeType={data.kpis.collectionRate >= 80 ? "positive" : "negative"}
              icon={TrendingUp}
            />
            <KPICard
              title="Current (Not Overdue)"
              value={formatCurrency(data.aging.current)}
              icon={Clock}
            />
          </>
        ) : (
          <>
            <KPICard
              title="Total Receivables"
              value="$0"
              icon={DollarSign}
              description="No data yet"
            />
            <KPICard
              title="Overdue Amount"
              value="$0"
              icon={AlertTriangle}
              description="No data yet"
            />
            <KPICard
              title="Collection Rate"
              value="100%"
              icon={TrendingUp}
              description="No data yet"
            />
            <KPICard
              title="Current (Not Overdue)"
              value="$0"
              icon={Clock}
              description="No data yet"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CashFlowChart />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
