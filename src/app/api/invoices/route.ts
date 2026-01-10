import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const invoiceCreateSchema = z.object({
  clientId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  amount: z.number().positive(),
  amountPaid: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  issueDate: z.string().transform((s) => new Date(s)),
  dueDate: z.string().transform((s) => new Date(s)),
  status: z.enum(["pending", "partial", "paid", "overdue", "written_off"]).default("pending"),
  source: z.enum(["sync", "manual", "csv"]).default("manual"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const sortBy = searchParams.get("sortBy") ?? "dueDate";
    const sortOrder = searchParams.get("sortOrder") ?? "asc";

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    const today = new Date();
    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      client: inv.client,
      amount: Number(inv.amount),
      amountPaid: Number(inv.amountPaid),
      amountDue: Number(inv.amount) - Number(inv.amountPaid),
      currency: inv.currency,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      paidDate: inv.paidDate,
      status: inv.status,
      daysOverdue:
        inv.status !== "paid" && new Date(inv.dueDate) < today
          ? Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      recoveryScore: inv.recoveryLikelihoodScore,
      predictedPaymentDate: inv.predictedPaymentDate,
      recommendedAction: inv.recommendedAction,
      payments: inv.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        date: p.paymentDate,
        method: p.paymentMethod,
      })),
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Invoices GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role - only owner, admin, analyst can create invoices
    if (!["owner", "admin", "analyst"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = invoiceCreateSchema.parse(body);

    // Determine initial status
    let status = validated.status;
    if (validated.amountPaid >= validated.amount) {
      status = "paid";
    } else if (validated.amountPaid > 0) {
      status = "partial";
    } else if (new Date(validated.dueDate) < new Date()) {
      status = "overdue";
    }

    const invoice = await prisma.invoice.create({
      data: {
        organizationId: session.user.organizationId,
        clientId: validated.clientId,
        invoiceNumber: validated.invoiceNumber,
        amount: validated.amount,
        amountPaid: validated.amountPaid,
        currency: validated.currency,
        issueDate: validated.issueDate,
        dueDate: validated.dueDate,
        status,
        source: validated.source,
      },
      include: {
        client: true,
      },
    });

    // Update client totals
    if (validated.clientId) {
      await updateClientTotals(validated.clientId);
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Invoices POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function updateClientTotals(clientId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { clientId },
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  await prisma.client.update({
    where: { id: clientId },
    data: {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
    },
  });
}
