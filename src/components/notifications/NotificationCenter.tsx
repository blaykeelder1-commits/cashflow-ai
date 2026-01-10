"use client";

import { Bell, AlertTriangle, DollarSign, Clock, CheckCircle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Notification {
  id: string;
  type: "overdue" | "payment" | "reminder" | "alert" | "success";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  client?: {
    name: string;
    initials: string;
  };
  amount?: number;
  invoiceNumber?: string;
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "overdue",
    title: "Invoice Overdue",
    description: "Invoice #1042 from TechStart Inc is 30 days past due",
    timestamp: "2 hours ago",
    read: false,
    client: { name: "TechStart Inc", initials: "TS" },
    amount: 8750,
    invoiceNumber: "INV-1042",
  },
  {
    id: "2",
    type: "payment",
    title: "Payment Received",
    description: "Payment received for Invoice #1039 from Acme Corp",
    timestamp: "5 hours ago",
    read: false,
    client: { name: "Acme Corp", initials: "AC" },
    amount: 12500,
    invoiceNumber: "INV-1039",
  },
  {
    id: "3",
    type: "reminder",
    title: "Payment Due Soon",
    description: "Invoice #1041 from Bright Ideas LLC is due in 3 days",
    timestamp: "1 day ago",
    read: true,
    client: { name: "Bright Ideas LLC", initials: "BI" },
    amount: 22000,
    invoiceNumber: "INV-1041",
  },
  {
    id: "4",
    type: "alert",
    title: "High Risk Client",
    description: "Metro Design has multiple overdue invoices",
    timestamp: "1 day ago",
    read: true,
    client: { name: "Metro Design", initials: "MD" },
  },
  {
    id: "5",
    type: "success",
    title: "Invoice Sent",
    description: "Invoice #1045 successfully sent to Global Solutions",
    timestamp: "2 days ago",
    read: true,
    client: { name: "Global Solutions", initials: "GS" },
    amount: 15000,
    invoiceNumber: "INV-1045",
  },
  {
    id: "6",
    type: "overdue",
    title: "Invoice Overdue",
    description: "Invoice #1043 from Metro Design is 15 days past due",
    timestamp: "3 days ago",
    read: true,
    client: { name: "Metro Design", initials: "MD" },
    amount: 12750,
    invoiceNumber: "INV-1043",
  },
];

const getIcon = (type: Notification["type"]) => {
  switch (type) {
    case "overdue":
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    case "payment":
      return <DollarSign className="h-5 w-5 text-green-600" />;
    case "reminder":
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case "alert":
      return <Bell className="h-5 w-5 text-orange-600" />;
    case "success":
      return <CheckCircle className="h-5 w-5 text-blue-600" />;
  }
};

const getBadge = (type: Notification["type"]) => {
  switch (type) {
    case "overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    case "payment":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Payment</Badge>;
    case "reminder":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Reminder</Badge>;
    case "alert":
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Alert</Badge>;
    case "success":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Success</Badge>;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
};

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <Card className={`${!notification.read ? "bg-primary/5 border-primary/20" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{notification.title}</p>
              {getBadge(notification.type)}
              {!notification.read && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{notification.description}</p>
            {notification.client && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {notification.client.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{notification.client.name}</span>
                {notification.amount && (
                  <span className="text-sm font-medium">
                    {formatCurrency(notification.amount)}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {notification.timestamp}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationCenter() {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const overdueNotifications = notifications.filter((n) => n.type === "overdue");
  const paymentNotifications = notifications.filter((n) => n.type === "payment");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Notification Center</h2>
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Mark All as Read</Button>
          <Button variant="outline">Settings</Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({overdueNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="payments">
            Payments ({paymentNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-3">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </TabsContent>

        <TabsContent value="unread" className="mt-4 space-y-3">
          {notifications
            .filter((n) => !n.read)
            .map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
        </TabsContent>

        <TabsContent value="overdue" className="mt-4 space-y-3">
          {overdueNotifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </TabsContent>

        <TabsContent value="payments" className="mt-4 space-y-3">
          {paymentNotifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
