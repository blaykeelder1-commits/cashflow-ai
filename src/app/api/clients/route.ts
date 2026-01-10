import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const clientCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  externalId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get("tier");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const sortBy = searchParams.get("sortBy") ?? "name";
    const sortOrder = searchParams.get("sortOrder") ?? "asc";

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (tier && tier !== "all") {
      where.paymentBehaviorTier = tier;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          invoices: {
            where: {
              status: { in: ["pending", "partial", "overdue"] },
            },
            select: {
              id: true,
              amount: true,
              amountPaid: true,
              dueDate: true,
              status: true,
            },
          },
          _count: {
            select: { invoices: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    const formattedClients = clients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      paymentBehaviorScore: client.paymentBehaviorScore,
      paymentBehaviorTier: client.paymentBehaviorTier,
      avgDaysToPay: client.avgDaysToPay ? Number(client.avgDaysToPay) : null,
      totalInvoiced: Number(client.totalInvoiced),
      totalPaid: Number(client.totalPaid),
      totalOutstanding: Number(client.totalOutstanding),
      invoiceCount: client._count.invoices,
      openInvoices: client.invoices.length,
      openInvoicesTotal: client.invoices.reduce(
        (sum, inv) => sum + Number(inv.amount) - Number(inv.amountPaid),
        0
      ),
    }));

    return NextResponse.json({
      clients: formattedClients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Clients GET error:", error);
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
    const validated = clientCreateSchema.parse(body);

    // Check for duplicate
    if (validated.externalId) {
      const existing = await prisma.client.findUnique({
        where: {
          organizationId_externalId: {
            organizationId: session.user.organizationId,
            externalId: validated.externalId,
          },
        },
      });

      if (existing) {
        return NextResponse.json({ error: "Client with this external ID already exists" }, { status: 409 });
      }
    }

    const client = await prisma.client.create({
      data: {
        organizationId: session.user.organizationId,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        externalId: validated.externalId,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Clients POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
