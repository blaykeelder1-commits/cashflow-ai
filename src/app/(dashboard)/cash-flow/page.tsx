import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";

const upcomingPayments = [
  { client: "Bright Ideas LLC", amount: 22000, dueDate: "Feb 1, 2026", daysUntil: 22 },
  { client: "Global Solutions", amount: 15000, dueDate: "Feb 7, 2026", daysUntil: 28 },
  { client: "Summit Partners", amount: 5500, dueDate: "Jan 19, 2026", daysUntil: 9 },
];

const recentPayments = [
  { client: "Acme Corp", amount: 12500, paidDate: "Jan 8, 2026" },
  { client: "Acme Corp", amount: 8500, paidDate: "Jan 5, 2026" },
  { client: "Summit Partners", amount: 5500, paidDate: "Jan 2, 2026" },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function CashFlowPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cash Flow</h1>
        <p className="text-muted-foreground">
          Monitor your cash flow projections and upcoming payments.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash Position
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$89,230</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-medium">+$12,500</span> today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expected Inflow (30d)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$42,500</div>
            <p className="text-xs text-muted-foreground mt-1">
              From 3 pending invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expected Outflow (30d)
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">$28,000</div>
            <p className="text-xs text-muted-foreground mt-1">
              Projected expenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Cash Flow (30d)
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+$14,500</div>
            <p className="text-xs text-muted-foreground mt-1">
              Projected net positive
            </p>
          </CardContent>
        </Card>
      </div>

      <CashFlowChart />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-green-600" />
              Expected Payments
            </CardTitle>
            <CardDescription>Upcoming payments from clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingPayments.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{payment.client}</p>
                    <p className="text-sm text-muted-foreground">
                      Due {payment.dueDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      in {payment.daysUntil} days
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-blue-600" />
              Recent Payments
            </CardTitle>
            <CardDescription>Payments received this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{payment.client}</p>
                    <p className="text-sm text-muted-foreground">
                      Paid {payment.paidDate}
                    </p>
                  </div>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
