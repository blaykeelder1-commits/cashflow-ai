import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all invoices for the organization
    const invoices = await prisma.invoice.findMany({
      where: { organizationId: orgId },
      include: { client: true },
    });

    // Calculate KPIs
    const totalReceivables = invoices
      .filter((inv) => inv.status !== "paid" && inv.status !== "written_off")
      .reduce((sum, inv) => sum + Number(inv.amount) - Number(inv.amountPaid), 0);

    const overdueInvoices = invoices.filter(
      (inv) =>
        (inv.status === "pending" || inv.status === "partial" || inv.status === "overdue") &&
        new Date(inv.dueDate) < today
    );

    const totalOverdue = overdueInvoices.reduce(
      (sum, inv) => sum + Number(inv.amount) - Number(inv.amountPaid),
      0
    );

    // Aging buckets
    const overdue30 = overdueInvoices
      .filter((inv) => {
        const daysOverdue = Math.floor(
          (today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysOverdue <= 30;
      })
      .reduce((sum, inv) => sum + Number(inv.amount) - Number(inv.amountPaid), 0);

    const overdue60 = overdueInvoices
      .filter((inv) => {
        const daysOverdue = Math.floor(
          (today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysOverdue > 30 && daysOverdue <= 60;
      })
      .reduce((sum, inv) => sum + Number(inv.amount) - Number(inv.amountPaid), 0);

    const overdue90Plus = overdueInvoices
      .filter((inv) => {
        const daysOverdue = Math.floor(
          (today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysOverdue > 60;
      })
      .reduce((sum, inv) => sum + Number(inv.amount) - Number(inv.amountPaid), 0);

    // Get top at-risk invoices
    const atRiskInvoices = overdueInvoices
      .map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.client?.name ?? "Unknown",
        amount: Number(inv.amount) - Number(inv.amountPaid),
        daysOverdue: Math.floor(
          (today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        ),
        recoveryScore: inv.recoveryLikelihoodScore ?? 50,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Get recent payments (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPayments = await prisma.invoicePayment.findMany({
      where: {
        invoice: { organizationId: orgId },
        paymentDate: { gte: thirtyDaysAgo },
      },
      include: { invoice: { include: { client: true } } },
      orderBy: { paymentDate: "desc" },
      take: 10,
    });

    // Get client stats
    const clients = await prisma.client.findMany({
      where: { organizationId: orgId },
    });

    const clientsByTier = {
      A: clients.filter((c) => c.paymentBehaviorTier === "A").length,
      B: clients.filter((c) => c.paymentBehaviorTier === "B").length,
      C: clients.filter((c) => c.paymentBehaviorTier === "C").length,
      D: clients.filter((c) => c.paymentBehaviorTier === "D").length,
      unscored: clients.filter((c) => !c.paymentBehaviorTier).length,
    };

    return NextResponse.json({
      kpis: {
        totalReceivables,
        totalOverdue,
        overdueCount: overdueInvoices.length,
        collectionRate:
          totalReceivables > 0
            ? ((totalReceivables - totalOverdue) / totalReceivables) * 100
            : 100,
      },
      aging: {
        current: totalReceivables - totalOverdue,
        overdue30,
        overdue60,
        overdue90Plus,
      },
      atRiskInvoices,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        date: p.paymentDate,
        clientName: p.invoice.client?.name ?? "Unknown",
        invoiceNumber: p.invoice.invoiceNumber,
      })),
      clientsByTier,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
