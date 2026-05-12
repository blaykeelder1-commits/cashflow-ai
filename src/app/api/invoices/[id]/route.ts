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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            paymentBehaviorScore: true,
            paymentBehaviorTier: true,
            avgDaysToPay: true,
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        followUpActions: {
          orderBy: { actionDate: "desc" },
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
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const today = new Date();
    const daysOverdue =
      invoice.status !== "paid" && new Date(invoice.dueDate) < today
        ? Math.floor((today.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const formattedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      client: invoice.client
        ? {
            ...invoice.client,
            avgDaysToPay: invoice.client.avgDaysToPay ? Number(invoice.client.avgDaysToPay) : null,
          }
        : null,
      amount: Number(invoice.amount),
      amountPaid: Number(invoice.amountPaid),
      amountDue: Number(invoice.amount) - Number(invoice.amountPaid),
      currency: invoice.currency,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate,
      status: invoice.status,
      daysOverdue,
      recoveryScore: invoice.recoveryLikelihoodScore,
      predictedPaymentDate: invoice.predictedPaymentDate,
      recommendedAction: invoice.recommendedAction,
      payments: invoice.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        date: p.paymentDate,
        method: p.paymentMethod,
        dayOfWeek: p.dayOfWeek,
        daysFromDue: p.daysFromDue,
      })),
      followUpActions: invoice.followUpActions.map((f) => ({
        id: f.id,
        actionType: f.actionType,
        actionDate: f.actionDate,
        notes: f.notes,
        outcome: f.outcome,
        nextActionDate: f.nextActionDate,
        createdBy: f.user,
        ledToPayment: f.ledToPayment,
      })),
      recommendations: invoice.aiRecommendations.map((r) => ({
        id: r.id,
        type: r.recommendationType,
        text: r.recommendationText,
        confidence: r.confidenceScore ? Number(r.confidenceScore) : null,
        reasoning: r.reasoning,
      })),
    };

    return NextResponse.json(formattedInvoice);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
