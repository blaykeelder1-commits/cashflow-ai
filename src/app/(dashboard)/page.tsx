import { DollarSign, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your cash flow overview and key metrics at a glance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Receivables"
          value="$142,580"
          change="+12.5%"
          changeType="positive"
          icon={DollarSign}
          description="from last month"
        />
        <KPICard
          title="Overdue Amount"
          value="$23,450"
          change="-8.2%"
          changeType="positive"
          icon={AlertTriangle}
          description="from last month"
        />
        <KPICard
          title="Cash Position"
          value="$89,230"
          change="+15.3%"
          changeType="positive"
          icon={TrendingUp}
          description="from last month"
        />
        <KPICard
          title="Days Sales Outstanding"
          value="32 days"
          change="-3 days"
          changeType="positive"
          icon={Clock}
          description="from last month"
        />
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
