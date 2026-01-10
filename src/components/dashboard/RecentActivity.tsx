import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowDownLeft, ArrowUpRight, Clock, AlertCircle } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "payment_received" | "invoice_sent" | "invoice_overdue" | "payment_reminder";
  title: string;
  description: string;
  amount?: number;
  client: string;
  clientInitials: string;
  timestamp: string;
}

const recentActivities: ActivityItem[] = [
  {
    id: "1",
    type: "payment_received",
    title: "Payment Received",
    description: "Invoice #1039 paid in full",
    amount: 12500,
    client: "Acme Corp",
    clientInitials: "AC",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    type: "invoice_overdue",
    title: "Invoice Overdue",
    description: "Invoice #1042 is 30 days past due",
    amount: 8750,
    client: "TechStart Inc",
    clientInitials: "TS",
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    type: "invoice_sent",
    title: "Invoice Sent",
    description: "Invoice #1045 sent to client",
    amount: 15000,
    client: "Global Solutions",
    clientInitials: "GS",
    timestamp: "1 day ago",
  },
  {
    id: "4",
    type: "payment_reminder",
    title: "Reminder Sent",
    description: "Payment reminder for Invoice #1041",
    client: "Bright Ideas LLC",
    clientInitials: "BI",
    timestamp: "1 day ago",
  },
  {
    id: "5",
    type: "payment_received",
    title: "Payment Received",
    description: "Partial payment for Invoice #1038",
    amount: 5000,
    client: "Metro Design",
    clientInitials: "MD",
    timestamp: "2 days ago",
  },
];

const getActivityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "payment_received":
      return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
    case "invoice_sent":
      return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
    case "invoice_overdue":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case "payment_reminder":
      return <Clock className="h-4 w-4 text-yellow-600" />;
  }
};

const getActivityBadge = (type: ActivityItem["type"]) => {
  switch (type) {
    case "payment_received":
      return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Received</Badge>;
    case "invoice_sent":
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Sent</Badge>;
    case "invoice_overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    case "payment_reminder":
      return <Badge variant="outline">Reminder</Badge>;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest transactions and invoice updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {activity.clientInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {getActivityIcon(activity.type)}
                  <p className="text-sm font-medium">{activity.title}</p>
                  {getActivityBadge(activity.type)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activity.description} - {activity.client}
                </p>
              </div>
              <div className="text-right">
                {activity.amount && (
                  <p className="text-sm font-medium">{formatCurrency(activity.amount)}</p>
                )}
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
