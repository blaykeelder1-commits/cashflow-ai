/**
 * Economic Indicators API
 *
 * GET /api/economic-indicators - Get economic indicator data
 * GET /api/economic-indicators?latest=true - Get most recent indicators
 * GET /api/economic-indicators?from=DATE&to=DATE - Get historical range
 *
 * POST /api/economic-indicators/refresh - Trigger data refresh (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import {
  fetchLatestIndicators,
  fetchHistoricalIndicators,
  getIndicatorForDate,
  refreshIndicators,
  getRecessionRiskLevel,
  analyzeEconomicTrends,
} from '@/lib/economic-indicators';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const date = searchParams.get('date');
    const includeAnalysis = searchParams.get('analysis') === 'true';

    // Get specific date
    if (date) {
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      const indicator = await getIndicatorForDate(targetDate);

      if (!indicator) {
        return NextResponse.json(
          { error: 'No indicator data for specified date' },
          { status: 404 }
        );
      }

      return NextResponse.json(indicator);
    }

    // Get historical range
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      const indicators = await fetchHistoricalIndicators(start, end);

      if (includeAnalysis && indicators.length >= 2) {
        const trends = analyzeEconomicTrends(indicators);
        return NextResponse.json({
          indicators,
          trends,
          period: { from: start, to: end },
        });
      }

      return NextResponse.json({
        indicators,
        period: { from: start, to: end },
      });
    }

    // Get latest indicators (default)
    const result = await fetchLatestIndicators({ useMockData: false });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch indicators' },
        { status: 500 }
      );
    }

    // Include recession risk analysis if requested
    if (includeAnalysis) {
      const riskAssessment = getRecessionRiskLevel(result.data);

      return NextResponse.json({
        data: result.data,
        source: result.source,
        fetchedAt: result.fetchedAt,
        riskAssessment,
      });
    }

    return NextResponse.json({
      data: result.data,
      source: result.source,
      fetchedAt: result.fetchedAt,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch economic indicators' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins/owners can trigger refresh
    if (!['owner', 'admin'].includes(session.user.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await refreshIndicators();

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to refresh economic indicators' },
      { status: 500 }
    );
  }
}
