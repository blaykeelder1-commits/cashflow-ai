import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const followUpCreateSchema = z.object({
  invoiceId: z.string().optional(),
  clientId: z.string().optional(),
  actionType: z.enum(["email", "call", "meeting", "escalation", "sms"]),
  actionDate: z.string().transform((s) => new Date(s)).optional(),
  notes: z.string().optional(),
  outcome: z.enum([
    "no_response",
    "promised_payment",
    "dispute",
    "partial_payment",
    "paid",
    "escalated",
  ]).optional(),
  nextActionDate: z.string().transform((s) => new Date(s)).optional().nullable(),
});

const followUpUpdateSchema = z.object({
  notes: z.string().optional(),
  outcome: z.enum([
    "no_response",
    "promised_payment",
    "dispute",
    "partial_payment",
    "paid",
    "escalated",
  ]).optional(),
  nextActionDate: z.string().transform((s) => new Date(s)).optional().nullable(),
  ledToPayment: z.boolean().optional(),
  daysToPayment: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");
    const clientId = searchParams.get("clientId");
    const actionType = searchParams.get("actionType");
    const outcome = searchParams.get("outcome");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const sortBy = searchParams.get("sortBy") ?? "actionDate";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";

    const where: Prisma.FollowUpActionWhereInput = {
      organizationId: session.user.organizationId,
      ...(invoiceId && { invoiceId }),
      ...(clientId && { clientId }),
      ...(actionType && { actionType }),
      ...(outcome && { outcome }),
    };

    const [actions, total] = await Promise.all([
      prisma.followUpAction.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
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
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.followUpAction.count({ where }),
    ]);

    const formattedActions = actions.map((action) => ({
      id: action.id,
      actionType: action.actionType,
      actionDate: action.actionDate,
      notes: action.notes,
      outcome: action.outcome,
      nextActionDate: action.nextActionDate,
      dayOfWeek: action.dayOfWeek,
      hourOfDay: action.hourOfDay,
      ledToPayment: action.ledToPayment,
      daysToPayment: action.daysToPayment,
      client: action.client,
      invoice: action.invoice
        ? {
            ...action.invoice,
            amount: Number(action.invoice.amount),
          }
        : null,
      createdBy: action.user,
      createdAt: action.createdAt,
    }));

    return NextResponse.json({
      actions: formattedActions,
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

    const body = await request.json();
    const validated = followUpCreateSchema.parse(body);

    // Require at least one of invoiceId or clientId
    if (!validated.invoiceId && !validated.clientId) {
      return NextResponse.json(
        { error: "Either invoiceId or clientId is required" },
        { status: 400 }
      );
    }

    // If invoiceId provided, verify it belongs to this org and get clientId
    let clientId = validated.clientId;
    if (validated.invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: validated.invoiceId,
          organizationId: session.user.organizationId,
        },
      });

      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      if (!clientId && invoice.clientId) {
        clientId = invoice.clientId;
      }
    }

    // If clientId provided, verify it belongs to this org
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          organizationId: session.user.organizationId,
        },
      });

      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }

    const actionDate = validated.actionDate ?? new Date();
    const dayOfWeek = actionDate.getDay();
    const hourOfDay = actionDate.getHours();

    const action = await prisma.followUpAction.create({
      data: {
        organizationId: session.user.organizationId,
        invoiceId: validated.invoiceId,
        clientId: clientId,
        userId: session.user.id,
        actionType: validated.actionType,
        actionDate,
        notes: validated.notes,
        outcome: validated.outcome,
        nextActionDate: validated.nextActionDate,
        dayOfWeek,
        hourOfDay,
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
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Update client's lastContactDate if applicable
    if (clientId) {
      await prisma.client.update({
        where: { id: clientId },
        data: {
          bestContactDay: getDayName(dayOfWeek),
          bestContactHour: hourOfDay,
        },
      });
    }

    return NextResponse.json(
      {
        id: action.id,
        actionType: action.actionType,
        actionDate: action.actionDate,
        notes: action.notes,
        outcome: action.outcome,
        nextActionDate: action.nextActionDate,
        client: action.client,
        invoice: action.invoice
          ? { ...action.invoice, amount: Number(action.invoice.amount) }
          : null,
        createdBy: action.user,
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Action ID required" }, { status: 400 });
    }

    // Verify action belongs to this organization
    const existing = await prisma.followUpAction.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Follow-up action not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = followUpUpdateSchema.parse(body);

    const updated = await prisma.followUpAction.update({
      where: { id },
      data: {
        notes: validated.notes,
        outcome: validated.outcome,
        nextActionDate: validated.nextActionDate,
        ledToPayment: validated.ledToPayment,
        daysToPayment: validated.daysToPayment,
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
      actionType: updated.actionType,
      notes: updated.notes,
      outcome: updated.outcome,
      nextActionDate: updated.nextActionDate,
      ledToPayment: updated.ledToPayment,
      daysToPayment: updated.daysToPayment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["owner", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Action ID required" }, { status: 400 });
    }

    // Verify action belongs to this organization
    const existing = await prisma.followUpAction.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Follow-up action not found" }, { status: 404 });
    }

    await prisma.followUpAction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getDayName(dayOfWeek: number): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[dayOfWeek] ?? "monday";
}
