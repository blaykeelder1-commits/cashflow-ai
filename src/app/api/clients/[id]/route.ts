import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        invoices: {
          orderBy: { dueDate: "desc" },
          take: 20,
          include: {
            payments: true,
          },
        },
        followUpActions: {
          orderBy: { actionDate: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        aiRecommendations: {
          where: { status: "pending" },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        seasonalPatterns: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Calculate payment patterns
    const paidInvoices = client.invoices.filter((inv) => inv.status === "paid" && inv.paidDate);
    let onTimeCount = 0;
    let late1to15Count = 0;
    let late16to30Count = 0;
    let late30plusCount = 0;

    paidInvoices.forEach((inv) => {
      if (!inv.paidDate) return;
      const daysLate = Math.floor(
        (new Date(inv.paidDate).getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysLate <= 0) onTimeCount++;
      else if (daysLate <= 15) late1to15Count++;
      else if (daysLate <= 30) late16to30Count++;
      else late30plusCount++;
    });

    const totalPaidCount = paidInvoices.length || 1;
    const paymentPatterns = {
      onTime: Math.round((onTimeCount / totalPaidCount) * 100),
      late1to15: Math.round((late1to15Count / totalPaidCount) * 100),
      late16to30: Math.round((late16to30Count / totalPaidCount) * 100),
      late30plus: Math.round((late30plusCount / totalPaidCount) * 100),
    };

    // Calculate risk level
    const riskLevel =
      client.paymentBehaviorTier === "D"
        ? "high"
        : client.paymentBehaviorTier === "C"
          ? "medium"
          : "low";

    // Calculate stats
    const overdueInvoices = client.invoices.filter(
      (inv) => inv.status === "overdue" || (inv.status !== "paid" && new Date(inv.dueDate) < new Date())
    );
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + Number(inv.amount) - Number(inv.amountPaid),
      0
    );

    const formattedClient = {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      industry: client.industry,
      initials: client.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      paymentBehaviorScore: client.paymentBehaviorScore,
      paymentBehaviorTier: client.paymentBehaviorTier,
      avgDaysToPay: client.avgDaysToPay ? Number(client.avgDaysToPay) : null,
      riskLevel,
      bestContactDay: client.bestContactDay,
      bestContactHour: client.bestContactHour,
      stats: {
        totalReceivables: Number(client.totalOutstanding),
        overdueAmount,
        averagePaymentDays: client.avgDaysToPay ? Number(client.avgDaysToPay) : 30,
        lifetimeValue: Number(client.totalPaid),
        invoiceCount: client.invoices.length,
        onTimePaymentRate: paymentPatterns.onTime,
      },
      invoices: client.invoices.map((inv) => ({
        id: inv.id,
        number: inv.invoiceNumber,
        amount: Number(inv.amount),
        amountPaid: Number(inv.amountPaid),
        status: inv.status,
        dueDate: inv.dueDate,
        paidDate: inv.paidDate,
      })),
      paymentPatterns,
      followUpActions: client.followUpActions.map((f) => ({
        id: f.id,
        actionType: f.actionType,
        actionDate: f.actionDate,
        notes: f.notes,
        outcome: f.outcome,
        nextActionDate: f.nextActionDate,
        createdBy: f.user,
        ledToPayment: f.ledToPayment,
      })),
      recommendations: client.aiRecommendations.map((r) => ({
        id: r.id,
        type: r.recommendationType,
        text: r.recommendationText,
        confidence: r.confidenceScore ? Number(r.confidenceScore) : null,
        reasoning: r.reasoning,
      })),
      seasonalPatterns: client.seasonalPatterns,
    };

    return NextResponse.json(formattedClient);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
