"use client";

import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useForecasts } from "@/hooks/use-forecasts";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface ChartDataPoint {
  date: string;
  inflow: number;
  cumulative: number;
}

function ChartContent({ data }: { data: ChartDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
          formatter={(value) => formatCurrency(value as number)}
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
          name="Daily Inflow"
          stroke="#22c55e"
          fillOpacity={1}
          fill="url(#colorInflow)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          name="Cumulative"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorCumulative)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[350px] flex items-center justify-center">
      <Skeleton className="h-full w-full" />
    </div>
  );
}

function ForecastTab({ days }: { days: number }) {
  const { data, isLoading, error } = useForecasts(days);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground">
        Failed to load forecast data
      </div>
    );
  }

  if (data.forecast.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground">
        No forecast data available. Add invoices to see projections.
      </div>
    );
  }

  const chartData: ChartDataPoint[] = data.forecast.map((point) => ({
    date: new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    inflow: Math.round(point.predictedInflow),
    cumulative: Math.round(point.cumulative),
  }));

  return <ChartContent data={chartData} />;
}

export function CashFlowChart() {
  const [activeTab, setActiveTab] = useState("30");

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Cash Flow Projection</CardTitle>
        <CardDescription>
          Projected cash inflow based on outstanding invoices and payment patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="30">30 Days</TabsTrigger>
            <TabsTrigger value="60">60 Days</TabsTrigger>
            <TabsTrigger value="90">90 Days</TabsTrigger>
          </TabsList>
          <TabsContent value="30">
            <ForecastTab days={30} />
          </TabsContent>
          <TabsContent value="60">
            <ForecastTab days={60} />
          </TabsContent>
          <TabsContent value="90">
            <ForecastTab days={90} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
