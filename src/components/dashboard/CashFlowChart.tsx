"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for cash flow projections
const generateData = (days: number) => {
  const data = [];
  const today = new Date();
  let inflow = 45000;
  let outflow = 35000;

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    // Add some variance
    inflow = inflow + (Math.random() - 0.4) * 5000;
    outflow = outflow + (Math.random() - 0.5) * 3000;

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      inflow: Math.round(inflow),
      outflow: Math.round(outflow),
      net: Math.round(inflow - outflow),
    });
  }

  return data;
};

const data30 = generateData(30);
const data60 = generateData(60);
const data90 = generateData(90);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

function ChartContent({ data }: { data: typeof data30 }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={(value) => `$${value / 1000}k`}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="inflow"
          name="Cash Inflow"
          stroke="#22c55e"
          fillOpacity={1}
          fill="url(#colorInflow)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="outflow"
          name="Cash Outflow"
          stroke="#ef4444"
          fillOpacity={1}
          fill="url(#colorOutflow)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CashFlowChart() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Cash Flow Projection</CardTitle>
        <CardDescription>
          Projected cash inflow and outflow based on outstanding invoices and expected payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="30">
          <TabsList className="mb-4">
            <TabsTrigger value="30">30 Days</TabsTrigger>
            <TabsTrigger value="60">60 Days</TabsTrigger>
            <TabsTrigger value="90">90 Days</TabsTrigger>
          </TabsList>
          <TabsContent value="30">
            <ChartContent data={data30} />
          </TabsContent>
          <TabsContent value="60">
            <ChartContent data={data60} />
          </TabsContent>
          <TabsContent value="90">
            <ChartContent data={data90} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
