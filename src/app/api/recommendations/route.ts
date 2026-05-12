import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { generateJsonCompletion, isOpenAIConfigured } from "@/lib/ai/openai-client";

const generateRecommendationsSchema = z.object({
  clientId: z.string().optional(),
  invoiceId: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
});

interface AIRecommendationResponse {
  recommendations: Array<{
    type: "follow_up" | "escalate" | "prioritize" | "deprioritize";
    text: string;
    confidence: number;
    reasoning: string;
    targetId?: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const invoiceId = searchParams.get("invoiceId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const where = {
      organizationId: session.user.organizationId,
      ...(status && status !== "all" && { status }),
      ...(clientId && { clientId }),
      ...(invoiceId && { invoiceId }),
    };

    const [recommendations, total] = await Promise.all([
      prisma.aIRecommendation.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              paymentBehaviorTier: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              amount: true,
              dueDate: true,
              status: true,
            },
          },
          actionedByUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: [
          { status: "asc" }, // pending first
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aIRecommendation.count({ where }),
    ]);

    const formattedRecommendations = recommendations.map((rec) => ({
      id: rec.id,
      type: rec.recommendationType,
      text: rec.recommendationText,
      confidence: rec.confidenceScore ? Number(rec.confidenceScore) : null,
      reasoning: rec.reasoning,
      status: rec.status,
      client: rec.client,
      invoice: rec.invoice
        ? {
            ...rec.invoice,
            amount: Number(rec.invoice.amount),
          }
        : null,
      actionedAt: rec.actionedAt,
      actionedBy: rec.actionedByUser,
      createdAt: rec.createdAt,
      expiresAt: rec.expiresAt,
    }));

    return NextResponse.json({
      recommendations: formattedRecommendations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["owner", "admin", "analyst"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validated = generateRecommendationsSchema.parse(body);

    // Fetch overdue invoices with client info
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: { in: ["overdue", "partial"] },
        ...(validated.clientId && { clientId: validated.clientId }),
        ...(validated.invoiceId && { id: validated.invoiceId }),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            paymentBehaviorScore: true,
            paymentBehaviorTier: true,
            avgDaysToPay: true,
            totalInvoiced: true,
            totalPaid: true,
          },
        },
        followUpActions: {
          orderBy: { actionDate: "desc" },
          take: 3,
        },
      },
      take: validated.limit,
      orderBy: [{ dueDate: "asc" }],
    });

    if (overdueInvoices.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: "No overdue invoices found to generate recommendations for",
      });
    }

    // Build context for AI
    const invoiceContext = overdueInvoices.map((inv) => {
      const today = new Date();
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const amountDue = Number(inv.amount) - Number(inv.amountPaid);
      const recentFollowUps = inv.followUpActions.map((f) => ({
        type: f.actionType,
        date: f.actionDate,
        outcome: f.outcome,
      }));

      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.client?.name ?? "Unknown",
        clientTier: inv.client?.paymentBehaviorTier ?? "C",
        clientPaymentScore: inv.client?.paymentBehaviorScore ?? 50,
        avgDaysToPay: inv.client?.avgDaysToPay ? Number(inv.client.avgDaysToPay) : null,
        amountDue,
        daysOverdue,
        hasPartialPayment: Number(inv.amountPaid) > 0,
        recentFollowUps,
      };
    });

    const prompt = `You are a cash flow optimization AI. Analyze these overdue invoices and generate actionable recommendations.

Invoice Data:
${JSON.stringify(invoiceContext, null, 2)}

For each invoice, determine the best action based on:
- Days overdue (urgency increases with time)
- Client payment tier (A=reliable, D=risky)
- Client payment score (0-100, higher is better)
- Amount due (prioritize larger amounts)
- Recent follow-up history

Generate recommendations in this JSON format:
{
  "recommendations": [
    {
      "type": "follow_up" | "escalate" | "prioritize" | "deprioritize",
      "text": "Specific actionable recommendation",
      "confidence": 0.0-1.0,
      "reasoning": "Brief explanation of why this action is recommended",
      "targetId": "invoiceId this applies to"
    }
  ]
}

Guidelines:
- "follow_up": Send a reminder (email, call, etc.)
- "escalate": Increase urgency or involve management
- "prioritize": Focus collection efforts here first
- "deprioritize": Lower priority due to low recovery likelihood

Be specific and actionable. Consider the client's payment history and recent interactions.`;

    const aiResponse = await generateJsonCompletion<AIRecommendationResponse>(prompt, {
      maxTokens: 2000,
      temperature: 0.4,
    });

    // Store recommendations in database
    const createdRecommendations = await Promise.all(
      aiResponse.recommendations.map(async (rec) => {
        const invoice = overdueInvoices.find((inv) => inv.id === rec.targetId);

        return prisma.aIRecommendation.create({
          data: {
            organizationId: session.user.organizationId!,
            invoiceId: rec.targetId,
            clientId: invoice?.clientId,
            recommendationType: rec.type,
            recommendationText: rec.text,
            confidenceScore: rec.confidence,
            reasoning: rec.reasoning,
            status: "pending",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                amount: true,
                dueDate: true,
              },
            },
          },
        });
      })
    );

    return NextResponse.json(
      {
        recommendations: createdRecommendations.map((rec) => ({
          id: rec.id,
          type: rec.recommendationType,
          text: rec.recommendationText,
          confidence: rec.confidenceScore ? Number(rec.confidenceScore) : null,
          reasoning: rec.reasoning,
          status: rec.status,
          client: rec.client,
          invoice: rec.invoice
            ? { ...rec.invoice, amount: Number(rec.invoice.amount) }
            : null,
          createdAt: rec.createdAt,
        })),
        generated: createdRecommendations.length,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["owner", "admin", "analyst"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = z
      .object({
        id: z.string(),
        status: z.enum(["accepted", "dismissed"]),
      })
      .parse(body);

    // Verify recommendation belongs to this organization
    const existing = await prisma.aIRecommendation.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    const updated = await prisma.aIRecommendation.update({
      where: { id },
      data: {
        status,
        actionedAt: new Date(),
        actionedBy: session.user.id,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        invoice: {
          select: { id: true, invoiceNumber: true },
        },
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      actionedAt: updated.actionedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
