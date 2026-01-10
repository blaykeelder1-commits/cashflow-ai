import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "30");
    const orgId = session.user.organizationId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get outstanding invoices with predictions
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["pending", "partial", "overdue"] },
      },
      include: {
        client: {
          select: {
            paymentBehaviorScore: true,
            avgDaysToPay: true,
          },
        },
      },
    });

    // Get historical payments for pattern analysis
    const historicalPayments = await prisma.invoicePayment.findMany({
      where: {
        invoice: { organizationId: orgId },
        paymentDate: {
          gte: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
      orderBy: { paymentDate: "asc" },
    });

    // Calculate daily average from historical payments
    const dailyPayments: Record<string, number> = {};
    historicalPayments.forEach((payment) => {
      const dateKey = payment.paymentDate.toISOString().split("T")[0];
      dailyPayments[dateKey] = (dailyPayments[dateKey] ?? 0) + Number(payment.amount);
    });

    const paymentDays = Object.keys(dailyPayments).length;
    const totalHistoricalPayments = Object.values(dailyPayments).reduce((a, b) => a + b, 0);
    const dailyAverage = paymentDays > 0 ? totalHistoricalPayments / paymentDays : 0;

    // Calculate day-of-week patterns
    const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];

    Object.entries(dailyPayments).forEach(([dateStr, amount]) => {
      const day = new Date(dateStr).getDay();
      weekdayTotals[day] += amount;
      weekdayCounts[day]++;
    });

    const weekdayAverages = weekdayTotals.map((total, i) =>
      weekdayCounts[i] > 0 ? total / weekdayCounts[i] : dailyAverage
    );

    // Generate forecast
    const forecast: Array<{
      date: string;
      predictedInflow: number;
      invoicePayments: number;
      baselinePayments: number;
      cumulative: number;
      confidence: number;
    }> = [];

    let cumulative = 0;

    for (let i = 0; i < days; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);
      const weekday = forecastDate.getDay();
      const dateStr = forecastDate.toISOString().split("T")[0];

      // Baseline from historical patterns
      const baselinePayments = weekdayAverages[weekday] ?? dailyAverage;

      // Invoice-specific predictions
      let invoicePayments = 0;
      invoices.forEach((inv) => {
        const amountDue = Number(inv.amount) - Number(inv.amountPaid);
        if (amountDue <= 0) return;

        // Use predicted payment date if available
        if (inv.predictedPaymentDate) {
          const predDate = new Date(inv.predictedPaymentDate);
          if (
            predDate.toISOString().split("T")[0] === dateStr
          ) {
            const probability = (inv.recoveryLikelihoodScore ?? 50) / 100;
            invoicePayments += amountDue * probability;
          }
        } else {
          // Estimate based on client behavior and due date
          const clientAvgDays = inv.client?.avgDaysToPay
            ? Number(inv.client.avgDaysToPay)
            : 30;
          const clientScore = inv.client?.paymentBehaviorScore ?? 50;
          const probability = clientScore / 100;

          const dueDate = new Date(inv.dueDate);
          const expectedPayDate = new Date(dueDate);
          expectedPayDate.setDate(expectedPayDate.getDate() + Math.round(clientAvgDays * 0.5));

          if (
            forecastDate >= dueDate &&
            forecastDate <= expectedPayDate
          ) {
            const daysInWindow = Math.max(
              1,
              (expectedPayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            invoicePayments += (amountDue * probability) / daysInWindow;
          }
        }
      });

      const predictedInflow = baselinePayments * 0.3 + invoicePayments * 0.7;
      cumulative += predictedInflow;

      // Confidence decreases further into the future
      const confidence = Math.max(0.3, 1 - i * 0.02);

      forecast.push({
        date: dateStr,
        predictedInflow: Math.round(predictedInflow * 100) / 100,
        invoicePayments: Math.round(invoicePayments * 100) / 100,
        baselinePayments: Math.round(baselinePayments * 100) / 100,
        cumulative: Math.round(cumulative * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
      });
    }

    // Detect cash gaps (simplified - assumes we need to maintain positive cash flow)
    const cashGaps = forecast
      .filter((f, i) => i > 0 && f.predictedInflow < dailyAverage * 0.5)
      .map((f) => ({
        date: f.date,
        expectedShortfall: Math.round((dailyAverage - f.predictedInflow) * 100) / 100,
      }));

    // Calculate summary stats
    const totalPredicted = forecast.reduce((sum, f) => sum + f.predictedInflow, 0);
    const avgDaily = totalPredicted / days;

    return NextResponse.json({
      forecast,
      summary: {
        totalPredicted: Math.round(totalPredicted * 100) / 100,
        averageDaily: Math.round(avgDaily * 100) / 100,
        historicalDailyAverage: Math.round(dailyAverage * 100) / 100,
        outstandingInvoices: invoices.length,
        totalOutstanding: invoices.reduce(
          (sum, inv) => sum + Number(inv.amount) - Number(inv.amountPaid),
          0
        ),
      },
      cashGaps,
      confidenceLevel: invoices.length > 10 ? "medium" : "low",
    });
  } catch (error) {
    console.error("Forecasts GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
