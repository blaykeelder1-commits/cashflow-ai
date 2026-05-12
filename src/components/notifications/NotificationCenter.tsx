"use client";

import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  DollarSign,
  Clock,
  Lightbulb,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications, type Notification } from "@/hooks/use-notifications";

const getIcon = (type: Notification["type"]) => {
  switch (type) {
    case "overdue":
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    case "payment":
      return <DollarSign className="h-5 w-5 text-green-600" />;
    case "reminder":
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case "alert":
      return <AlertCircle className="h-5 w-5 text-orange-600" />;
    case "recommendation":
      return <Lightbulb className="h-5 w-5 text-blue-600" />;
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
    case "recommendation":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">AI Insight</Badge>;
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
  const linkHref = notification.invoiceId
    ? `/invoices/${notification.invoiceId}`
    : notification.client
      ? `/clients/${notification.client.id}`
      : "#";

  return (
    <Link href={linkHref}>
      <Card
        className={`transition-colors hover:bg-muted/50 ${
          !notification.read ? "bg-primary/5 border-primary/20" : ""
        }`}
      >
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
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {notification.timestamp}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function NotificationSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center gap-2 mt-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ type }: { type: string }) {
  const messages: Record<string, { icon: React.ReactNode; text: string }> = {
    all: { icon: <Bell className="h-12 w-12" />, text: "No notifications yet" },
    unread: { icon: <Bell className="h-12 w-12" />, text: "All caught up!" },
    overdue: { icon: <AlertTriangle className="h-12 w-12" />, text: "No overdue invoices" },
    payment: { icon: <DollarSign className="h-12 w-12" />, text: "No recent payments" },
    reminder: { icon: <Clock className="h-12 w-12" />, text: "No upcoming due dates" },
    recommendation: { icon: <Lightbulb className="h-12 w-12" />, text: "No pending recommendations" },
  };

  const { icon, text } = messages[type] || messages.all;

  return (
    <div className="text-center py-12 text-muted-foreground">
      <div className="mx-auto mb-4 opacity-50">{icon}</div>
      <p>{text}</p>
    </div>
  );
}

export function NotificationCenter() {
  const { data, isLoading, error, refetch, isFetching } = useNotifications();

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <p className="text-muted-foreground mb-4">Failed to load notifications</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  const counts = data?.counts || {
    all: 0,
    unread: 0,
    overdue: 0,
    payment: 0,
    reminder: 0,
    recommendation: 0,
  };

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
              {counts.unread} unread notification{counts.unread !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({counts.unread})
            {counts.unread > 0 && (
              <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({counts.overdue})</TabsTrigger>
          <TabsTrigger value="payment">Payments ({counts.payment})</TabsTrigger>
          <TabsTrigger value="recommendation">AI ({counts.recommendation})</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="all" className="mt-4 space-y-3">
              {data?.notifications.length === 0 ? (
                <EmptyState type="all" />
              ) : (
                data?.notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              )}
            </TabsContent>

            <TabsContent value="unread" className="mt-4 space-y-3">
              {data?.notifications.filter((n) => !n.read).length === 0 ? (
                <EmptyState type="unread" />
              ) : (
                data?.notifications
                  .filter((n) => !n.read)
                  .map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
              )}
            </TabsContent>

            <TabsContent value="overdue" className="mt-4 space-y-3">
              {data?.notifications.filter((n) => n.type === "overdue").length === 0 ? (
                <EmptyState type="overdue" />
              ) : (
                data?.notifications
                  .filter((n) => n.type === "overdue")
                  .map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
              )}
            </TabsContent>

            <TabsContent value="payment" className="mt-4 space-y-3">
              {data?.notifications.filter((n) => n.type === "payment").length === 0 ? (
                <EmptyState type="payment" />
              ) : (
                data?.notifications
                  .filter((n) => n.type === "payment")
                  .map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
              )}
            </TabsContent>

            <TabsContent value="recommendation" className="mt-4 space-y-3">
              {data?.notifications.filter((n) => n.type === "recommendation").length === 0 ? (
                <EmptyState type="recommendation" />
              ) : (
                data?.notifications
                  .filter((n) => n.type === "recommendation")
                  .map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
