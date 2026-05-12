import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

interface Notification {
  id: string;
  type: "overdue" | "payment" | "reminder" | "alert" | "recommendation";
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  client?: {
    id: string;
    name: string;
    initials: string;
  };
  amount?: number;
  invoiceId?: string;
  invoiceNumber?: string;
  recommendationId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const now = new Date();
    const notifications: Notification[] = [];

    // 1. Get overdue invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: "overdue",
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    });

    for (const invoice of overdueInvoices) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const clientInitials = invoice.client?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??";

      notifications.push({
        id: `overdue-${invoice.id}`,
        type: "overdue",
        title: "Invoice Overdue",
        description: `Invoice ${invoice.invoiceNumber || invoice.id.slice(0, 8)} is ${daysOverdue} days past due`,
        timestamp: invoice.dueDate,
        read: daysOverdue > 7, // Consider older ones as "read"
        client: invoice.client
          ? {
              id: invoice.client.id,
              name: invoice.client.name,
              initials: clientInitials,
            }
          : undefined,
        amount: Number(invoice.amount) - Number(invoice.amountPaid),
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber ?? undefined,
      });
    }

    // 2. Get recent payments
    const recentPayments = await prisma.invoicePayment.findMany({
      where: {
        invoice: {
          organizationId: session.user.organizationId,
        },
        paymentDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        invoice: {
          include: {
            client: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
      take: 10,
    });

    for (const payment of recentPayments) {
      const clientInitials = payment.invoice.client?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??";

      notifications.push({
        id: `payment-${payment.id}`,
        type: "payment",
        title: "Payment Received",
        description: `Payment received for Invoice ${payment.invoice.invoiceNumber || payment.invoice.id.slice(0, 8)}`,
        timestamp: payment.paymentDate,
        read: true,
        client: payment.invoice.client
          ? {
              id: payment.invoice.client.id,
              name: payment.invoice.client.name,
              initials: clientInitials,
            }
          : undefined,
        amount: Number(payment.amount),
        invoiceId: payment.invoice.id,
        invoiceNumber: payment.invoice.invoiceNumber ?? undefined,
      });
    }

    // 3. Get invoices due soon (next 7 days)
    const upcomingDue = await prisma.invoice.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: { in: ["pending", "partial"] },
        dueDate: {
          gte: now,
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    });

    for (const invoice of upcomingDue) {
      const daysUntilDue = Math.floor(
        (new Date(invoice.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const clientInitials = invoice.client?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??";

      notifications.push({
        id: `reminder-${invoice.id}`,
        type: "reminder",
        title: "Payment Due Soon",
        description: `Invoice ${invoice.invoiceNumber || invoice.id.slice(0, 8)} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}`,
        timestamp: invoice.dueDate,
        read: daysUntilDue > 3,
        client: invoice.client
          ? {
              id: invoice.client.id,
              name: invoice.client.name,
              initials: clientInitials,
            }
          : undefined,
        amount: Number(invoice.amount) - Number(invoice.amountPaid),
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber ?? undefined,
      });
    }

    // 4. Get pending AI recommendations
    const pendingRecommendations = await prisma.aIRecommendation.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: "pending",
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        invoice: {
          select: { id: true, invoiceNumber: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    for (const rec of pendingRecommendations) {
      const clientInitials = rec.client?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      notifications.push({
        id: `rec-${rec.id}`,
        type: "recommendation",
        title: "AI Recommendation",
        description: rec.recommendationText.slice(0, 100) + (rec.recommendationText.length > 100 ? "..." : ""),
        timestamp: rec.createdAt,
        read: false,
        client: rec.client
          ? {
              id: rec.client.id,
              name: rec.client.name,
              initials: clientInitials || "??",
            }
          : undefined,
        invoiceId: rec.invoice?.id,
        invoiceNumber: rec.invoice?.invoiceNumber ?? undefined,
        recommendationId: rec.id,
      });
    }

    // 5. Get high-risk clients (Tier D with outstanding balance)
    const highRiskClients = await prisma.client.findMany({
      where: {
        organizationId: session.user.organizationId,
        paymentBehaviorTier: "D",
        totalOutstanding: { gt: 0 },
      },
      take: 5,
    });

    for (const client of highRiskClients) {
      const clientInitials = client.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??";

      notifications.push({
        id: `alert-${client.id}`,
        type: "alert",
        title: "High Risk Client",
        description: `${client.name} has ${Number(client.totalOutstanding).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} outstanding`,
        timestamp: client.updatedAt,
        read: true,
        client: {
          id: client.id,
          name: client.name,
          initials: clientInitials,
        },
        amount: Number(client.totalOutstanding),
      });
    }

    // Sort by timestamp (newest first) and filter by type if specified
    let filteredNotifications = notifications;
    if (type && type !== "all") {
      if (type === "unread") {
        filteredNotifications = notifications.filter((n) => !n.read);
      } else {
        filteredNotifications = notifications.filter((n) => n.type === type);
      }
    }

    filteredNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate counts
    const counts = {
      all: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      overdue: notifications.filter((n) => n.type === "overdue").length,
      payment: notifications.filter((n) => n.type === "payment").length,
      reminder: notifications.filter((n) => n.type === "reminder").length,
      alert: notifications.filter((n) => n.type === "alert").length,
      recommendation: notifications.filter((n) => n.type === "recommendation").length,
    };

    return NextResponse.json({
      notifications: filteredNotifications.slice(0, limit).map((n) => ({
        ...n,
        timestamp: getRelativeTime(n.timestamp),
        timestampRaw: n.timestamp,
      })),
      counts,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
