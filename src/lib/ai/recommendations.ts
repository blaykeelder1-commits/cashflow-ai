/**
 * Combined AI Recommendations Service
 *
 * Orchestrates all scoring functions to generate comprehensive recommendations.
 * Features:
 * - Client-level recommendations
 * - Prioritized action queue
 * - Dashboard metrics aggregation
 * - Full business intelligence pipeline
 */

import {
  calculatePaymentBehaviorScore,
  calculateBatchPaymentScores,
  calculateRecoveryLikelihood,
  calculateBatchRecoveryLikelihood,
  generateBatchFollowUpRecommendations,
  getTodaysFollowUpQueue,
} from '../scoring';

import {
  generateCashFlowForecast,
  detectCashGaps,
  getCashGapSummary,
} from '../forecast';

import {
  generateCashFlowSummary,
  generateScoreExplanation,
  generateGapResolutionInsight,
} from './insights';

import type {
  Client,
  Invoice,
  CashTransaction,
  ClientRecommendation,
  OverdueInvoiceSummary,
  DashboardMetrics,
  FollowUpRecommendation,
  AIInsight,
  PaymentBehaviorScore,
  RecoveryLikelihood,
  CashFlowForecast,
  CashGap,
} from '../scoring/types';

import type { CashGapSummary } from '../forecast/cash-gap';

/**
 * Input data for generating comprehensive recommendations
 */
export interface RecommendationInput {
  clients: Client[];
  invoices: Invoice[];
  historicalTransactions: CashTransaction[];
  scheduledOutflows: CashTransaction[];
  currentBalance: number;
  minimumBalanceThreshold: number;
}

/**
 * Complete recommendation output
 */
export interface RecommendationOutput {
  // Client-level recommendations
  clientRecommendations: ClientRecommendation[];

  // Today's action queue
  priorityQueue: FollowUpRecommendation[];

  // Cash flow analysis
  cashFlowForecast: CashFlowForecast;
  cashGaps: CashGap[];
  gapSummary: CashGapSummary;

  // Dashboard metrics
  dashboardMetrics: DashboardMetrics;

  // AI insights
  insights: AIInsight[];

  // Metadata
  generatedAt: Date;
  dataQuality: DataQualityReport;
}

export interface DataQualityReport {
  clientCount: number;
  invoiceCount: number;
  overdueCount: number;
  transactionHistoryDays: number;
  hasScheduledOutflows: boolean;
  completeness: number; // 0-100
}

/**
 * Generate comprehensive recommendations for all clients
 */
export async function generateRecommendations(
  input: RecommendationInput
): Promise<RecommendationOutput> {
  const {
    clients,
    invoices,
    historicalTransactions,
    scheduledOutflows,
    currentBalance,
    minimumBalanceThreshold,
  } = input;

  // Step 1: Calculate payment behavior scores for all clients
  const paymentScores = calculateBatchPaymentScores(clients);
  const scoreMap = new Map(paymentScores.map(s => [s.clientId, s]));
  const tierMap = new Map(paymentScores.map(s => [s.clientId, s.tier]));

  // Step 2: Calculate recovery likelihood for pending invoices
  const pendingInvoices = invoices.filter(
    inv => inv.status === 'overdue' || inv.status === 'partial' || inv.status === 'sent'
  );
  const clientMap = new Map(clients.map(c => [c.id, c]));

  const recoveryScores = calculateBatchRecoveryLikelihood(
    pendingInvoices,
    clientMap,
    tierMap
  );
  const recoveryMap = new Map(recoveryScores.map(r => [r.invoiceId, r]));

  // Step 3: Generate cash flow forecast
  const cashFlowForecast = generateCashFlowForecast({
    currentBalance,
    pendingInvoices,
    recoveryScores: recoveryMap,
    historicalTransactions,
    scheduledOutflows,
  });

  // Step 4: Detect cash gaps
  const cashGaps = detectCashGaps(cashFlowForecast, {
    minimumBalance: minimumBalanceThreshold,
    includeRecommendations: true,
  });
  const gapSummary = getCashGapSummary(cashGaps);

  // Step 5: Generate follow-up recommendations
  const overdueInvoices = invoices.filter(
    inv => inv.status === 'overdue' || inv.status === 'partial'
  );
  const recoveryScoreValues = new Map(
    recoveryScores.map(r => [r.invoiceId, r.score])
  );

  const followUpRecommendations = generateBatchFollowUpRecommendations(
    overdueInvoices,
    clientMap,
    tierMap,
    recoveryScoreValues
  );

  const priorityQueue = getTodaysFollowUpQueue(followUpRecommendations);

  // Step 6: Generate client-level recommendations
  const clientRecommendations = await generateClientRecommendations(
    clients,
    invoices,
    scoreMap,
    recoveryMap,
    followUpRecommendations
  );

  // Step 7: Generate AI insights
  const insights = await generateInsights(
    cashFlowForecast,
    gapSummary,
    cashGaps,
    paymentScores,
    recoveryScores,
    clients
  );

  // Step 8: Calculate dashboard metrics
  const dashboardMetrics = calculateDashboardMetrics(
    invoices,
    paymentScores,
    cashFlowForecast,
    gapSummary,
    priorityQueue
  );

  // Step 9: Generate data quality report
  const dataQuality = generateDataQualityReport(
    clients,
    invoices,
    historicalTransactions,
    scheduledOutflows
  );

  return {
    clientRecommendations,
    priorityQueue,
    cashFlowForecast,
    cashGaps,
    gapSummary,
    dashboardMetrics,
    insights,
    generatedAt: new Date(),
    dataQuality,
  };
}

/**
 * Generate recommendations for each client
 */
async function generateClientRecommendations(
  clients: Client[],
  invoices: Invoice[],
  scoreMap: Map<string, PaymentBehaviorScore>,
  recoveryMap: Map<string, RecoveryLikelihood>,
  followUps: FollowUpRecommendation[]
): Promise<ClientRecommendation[]> {
  const recommendations: ClientRecommendation[] = [];

  for (const client of clients) {
    const score = scoreMap.get(client.id);
    if (!score) continue;

    // Get client's overdue invoices
    const clientInvoices = invoices.filter(
      inv => inv.clientId === client.id &&
             (inv.status === 'overdue' || inv.status === 'partial')
    );

    const overdueInvoices: OverdueInvoiceSummary[] = clientInvoices.map(inv => {
      const recovery = recoveryMap.get(inv.id);
      const now = new Date();
      const daysOverdue = Math.max(
        0,
        Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      return {
        invoiceId: inv.id,
        amount: inv.amount - inv.paidAmount,
        daysOverdue,
        recoveryLikelihood: recovery?.score || 50,
      };
    });

    const totalOverdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + inv.amount,
      0
    );

    // Get follow-up recommendations for this client
    const clientFollowUps = followUps.filter(f => f.clientId === client.id);

    // Determine risk level
    const riskLevel = determineRiskLevel(score.tier, overdueInvoices);

    recommendations.push({
      clientId: client.id,
      clientName: client.name,
      tier: score.tier,
      paymentScore: score.score,
      overdueInvoices,
      totalOverdueAmount,
      recommendedActions: clientFollowUps,
      insights: [], // Insights generated separately
      riskLevel,
    });
  }

  // Sort by risk level and total overdue amount
  return recommendations.sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    if (riskDiff !== 0) return riskDiff;
    return b.totalOverdueAmount - a.totalOverdueAmount;
  });
}

/**
 * Determine client risk level
 */
function determineRiskLevel(
  tier: 'A' | 'B' | 'C' | 'D',
  overdueInvoices: OverdueInvoiceSummary[]
): 'low' | 'medium' | 'high' {
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const maxDaysOverdue = Math.max(0, ...overdueInvoices.map(inv => inv.daysOverdue));

  // High risk conditions
  if (tier === 'D') return 'high';
  if (totalOverdue > 50000) return 'high';
  if (maxDaysOverdue > 60) return 'high';

  // Medium risk conditions
  if (tier === 'C') return 'medium';
  if (totalOverdue > 10000) return 'medium';
  if (maxDaysOverdue > 30) return 'medium';

  return 'low';
}

/**
 * Generate AI insights from analysis
 */
async function generateInsights(
  forecast: CashFlowForecast,
  gapSummary: CashGapSummary,
  gaps: CashGap[],
  paymentScores: PaymentBehaviorScore[],
  recoveryScores: RecoveryLikelihood[],
  clients: Client[]
): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  // Cash flow summary insight
  try {
    const cashFlowInsight = await generateCashFlowSummary(forecast, gapSummary);
    insights.push(cashFlowInsight);
  } catch {
    // Failed to generate cash flow insight
  }

  // Gap resolution insights for critical/high gaps
  const urgentGaps = gaps.filter(g => g.severity === 'critical' || g.severity === 'high');
  for (const gap of urgentGaps.slice(0, 3)) {
    try {
      const gapInsight = await generateGapResolutionInsight(gap);
      insights.push(gapInsight);
    } catch {
      // Failed to generate gap insight
    }
  }

  // High-risk client insights
  const highRiskScores = paymentScores.filter(s => s.tier === 'D').slice(0, 3);
  for (const score of highRiskScores) {
    const client = clients.find(c => c.id === score.clientId);
    if (client) {
      try {
        const scoreInsight = await generateScoreExplanation(score, client.name);
        insights.push(scoreInsight);
      } catch {
        // Failed to generate score insight
      }
    }
  }

  return insights;
}

/**
 * Calculate dashboard metrics
 */
function calculateDashboardMetrics(
  invoices: Invoice[],
  paymentScores: PaymentBehaviorScore[],
  forecast: CashFlowForecast,
  gapSummary: CashGapSummary,
  priorityQueue: FollowUpRecommendation[]
): DashboardMetrics {
  const now = new Date();

  // Calculate overdue metrics
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
  const totalOverdue = overdueInvoices.reduce(
    (sum, inv) => sum + (inv.amount - inv.paidAmount),
    0
  );

  const avgDaysOverdue = overdueInvoices.length > 0
    ? overdueInvoices.reduce((sum, inv) => {
        const days = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / overdueInvoices.length
    : 0;

  // Total outstanding (all unpaid invoices)
  const unpaidInvoices = invoices.filter(
    inv => inv.status !== 'paid' && inv.status !== 'cancelled'
  );
  const totalOutstanding = unpaidInvoices.reduce(
    (sum, inv) => sum + (inv.amount - inv.paidAmount),
    0
  );

  // High risk clients count
  const highRiskClients = paymentScores.filter(s => s.tier === 'D').length;

  return {
    totalOutstanding,
    totalOverdue,
    overdueCount: overdueInvoices.length,
    avgDaysOverdue: Math.round(avgDaysOverdue),
    expectedCollections7Day: forecast.summary.period7Day.totalExpectedInflows,
    expectedCollections30Day: forecast.summary.period30Day.totalExpectedInflows,
    cashGapsDetected: gapSummary.totalGaps,
    highRiskClients,
    topPriorityFollowUps: priorityQueue.slice(0, 5),
  };
}

/**
 * Generate data quality report
 */
function generateDataQualityReport(
  clients: Client[],
  invoices: Invoice[],
  transactions: CashTransaction[],
  scheduledOutflows: CashTransaction[]
): DataQualityReport {
  const overdueCount = invoices.filter(
    inv => inv.status === 'overdue' || inv.status === 'partial'
  ).length;

  // Calculate transaction history span
  let historyDays = 0;
  if (transactions.length > 0) {
    const dates = transactions.map(t => t.date.getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    historyDays = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24));
  }

  // Calculate completeness score
  let completeness = 0;
  if (clients.length > 0) completeness += 25;
  if (invoices.length > 0) completeness += 25;
  if (transactions.length >= 30) completeness += 25;
  else if (transactions.length > 0) completeness += 15;
  if (scheduledOutflows.length > 0) completeness += 25;

  return {
    clientCount: clients.length,
    invoiceCount: invoices.length,
    overdueCount,
    transactionHistoryDays: historyDays,
    hasScheduledOutflows: scheduledOutflows.length > 0,
    completeness,
  };
}

/**
 * Quick analysis for a single client
 */
export async function analyzeClient(
  client: Client,
  invoices: Invoice[]
): Promise<{
  score: PaymentBehaviorScore;
  overdueInvoices: { invoice: Invoice; recovery: RecoveryLikelihood }[];
  insight: AIInsight | null;
}> {
  // Calculate payment score
  const score = calculatePaymentBehaviorScore(client);

  // Get overdue invoices and recovery scores
  const clientInvoices = invoices.filter(
    inv => inv.clientId === client.id &&
           (inv.status === 'overdue' || inv.status === 'partial')
  );

  const overdueInvoices = clientInvoices.map(invoice => ({
    invoice,
    recovery: calculateRecoveryLikelihood(invoice, client, score.tier),
  }));

  // Generate insight
  let insight: AIInsight | null = null;
  try {
    insight = await generateScoreExplanation(score, client.name);
  } catch {
    // Failed to generate client insight
  }

  return {
    score,
    overdueInvoices,
    insight,
  };
}

/**
 * Get prioritized collection opportunities
 */
export function getCollectionOpportunities(
  output: RecommendationOutput,
  limit: number = 10
): {
  invoiceId: string;
  clientName: string;
  amount: number;
  recoveryLikelihood: number;
  expectedValue: number;
  followUp: FollowUpRecommendation | undefined;
}[] {
  const opportunities: {
    invoiceId: string;
    clientName: string;
    amount: number;
    recoveryLikelihood: number;
    expectedValue: number;
    followUp: FollowUpRecommendation | undefined;
  }[] = [];

  for (const client of output.clientRecommendations) {
    for (const invoice of client.overdueInvoices) {
      const followUp = output.priorityQueue.find(f => f.invoiceId === invoice.invoiceId);
      const expectedValue = invoice.amount * (invoice.recoveryLikelihood / 100);

      opportunities.push({
        invoiceId: invoice.invoiceId,
        clientName: client.clientName,
        amount: invoice.amount,
        recoveryLikelihood: invoice.recoveryLikelihood,
        expectedValue,
        followUp,
      });
    }
  }

  // Sort by expected value (highest first)
  return opportunities
    .sort((a, b) => b.expectedValue - a.expectedValue)
    .slice(0, limit);
}
