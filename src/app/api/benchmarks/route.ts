/**
 * Industry Benchmarks API
 *
 * GET /api/benchmarks - Get all industry benchmarks
 * GET /api/benchmarks?industry=xxx - Get benchmark for specific industry
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import {
  getAllIndustryBenchmarks,
  getIndustryBenchmark,
  getBenchmarkResultsForOrganization,
} from '@/lib/benchmarks';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const includeClients = searchParams.get('includeClients') === 'true';

    // If specific industry requested
    if (industry) {
      const benchmark = await getIndustryBenchmark(industry);

      if (!benchmark) {
        return NextResponse.json(
          { error: `No benchmark found for industry: ${industry}` },
          { status: 404 }
        );
      }

      return NextResponse.json(benchmark);
    }

    // Get all benchmarks
    const benchmarks = await getAllIndustryBenchmarks();

    // Optionally include client benchmark comparisons
    if (includeClients) {
      const clientResults = await getBenchmarkResultsForOrganization(
        session.user.organizationId
      );

      return NextResponse.json({
        benchmarks,
        clientComparisons: clientResults,
      });
    }

    return NextResponse.json({ benchmarks });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch benchmarks' },
      { status: 500 }
    );
  }
}
