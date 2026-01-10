/**
 * Natural Language Insights Generator
 *
 * Uses OpenAI to generate human-readable insights from scoring and forecast data.
 * Features:
 * - Cash flow summaries
 * - Scoring explanations
 * - Trend analysis narratives
 * - Actionable recommendations
 */

import { generateCompletion, isOpenAIConfigured } from './openai-client';
import type {
  AIInsight,
  CashFlowForecast,
  PaymentBehaviorScore,
  RecoveryLikelihood,
  CashGap,
  ClientTier,
} from '../scoring/types';
import { CashGapSummary } from '../forecast/cash-gap';

/**
 * Generate a natural language cash flow summary
 */
export async function generateCashFlowSummary(
  forecast: CashFlowForecast,
  gapSummary: CashGapSummary
): Promise<AIInsight> {
  // If OpenAI not configured, return a template-based summary
  if (!isOpenAIConfigured()) {
    return generateTemplateBasedCashFlowSummary(forecast, gapSummary);
  }

  const prompt = `Analyze this cash flow forecast and provide a concise executive summary.

Current Balance: $${forecast.currentBalance.toLocaleString()}

7-Day Forecast:
- Expected Inflows: $${forecast.summary.period7Day.totalExpectedInflows.toLocaleString()}
- Expected Outflows: $${forecast.summary.period7Day.totalExpectedOutflows.toLocaleString()}
- Net Cash Flow: $${forecast.summary.period7Day.netCashFlow.toLocaleString()}
- Ending Balance: $${forecast.summary.period7Day.endingBalance.toLocaleString()}

30-Day Forecast:
- Expected Inflows: $${forecast.summary.period30Day.totalExpectedInflows.toLocaleString()}
- Expected Outflows: $${forecast.summary.period30Day.totalExpectedOutflows.toLocaleString()}
- Net Cash Flow: $${forecast.summary.period30Day.netCashFlow.toLocaleString()}
- Ending Balance: $${forecast.summary.period30Day.endingBalance.toLocaleString()}

Cash Gaps Detected: ${gapSummary.totalGaps}
- Critical: ${gapSummary.criticalGaps}
- High: ${gapSummary.highGaps}
- Medium: ${gapSummary.mediumGaps}
- Low: ${gapSummary.lowGaps}
${gapSummary.largestDeficit > 0 ? `- Largest Shortfall: $${gapSummary.largestDeficit.toLocaleString()}` : ''}

Provide:
1. A 2-3 sentence overview of the cash position
2. Key risks or concerns
3. Top 2-3 recommended actions

Keep it professional but accessible. Focus on what matters most.`;

  const response = await generateCompletion(prompt, {
    maxTokens: 500,
    temperature: 0.5,
  });

  return {
    id: `insight-cashflow-${Date.now()}`,
    type: 'cash_flow_warning',
    title: 'Cash Flow Summary',
    summary: extractFirstSentence(response),
    details: response,
    priority: determineCashFlowPriority(gapSummary),
    actionable: gapSummary.requiresImmediateAction,
    suggestedActions: extractActions(response),
    relatedEntityIds: [],
    generatedAt: new Date(),
  };
}

/**
 * Generate template-based cash flow summary (fallback when OpenAI not available)
 */
function generateTemplateBasedCashFlowSummary(
  forecast: CashFlowForecast,
  gapSummary: CashGapSummary
): AIInsight {
  const isPositive = forecast.summary.period30Day.netCashFlow >= 0;
  const hasGaps = gapSummary.totalGaps > 0;

  let summary: string;
  let details: string;
  const actions: string[] = [];

  if (isPositive && !hasGaps) {
    summary = 'Cash flow outlook is positive with no projected shortfalls.';
    details = `Your 30-day forecast shows a net positive cash flow of $${forecast.summary.period30Day.netCashFlow.toLocaleString()}. ` +
              `Current balance of $${forecast.currentBalance.toLocaleString()} is projected to grow to $${forecast.summary.period30Day.endingBalance.toLocaleString()}.`;
    actions.push('Continue monitoring receivables collection');
    actions.push('Consider investing excess cash');
  } else if (!isPositive && !hasGaps) {
    summary = 'Cash flow is slightly negative but no critical gaps detected.';
    details = `Your 30-day forecast shows a net cash outflow of $${Math.abs(forecast.summary.period30Day.netCashFlow).toLocaleString()}. ` +
              `Monitor closely and consider accelerating receivables.`;
    actions.push('Review and prioritize overdue invoices');
    actions.push('Consider delaying non-essential expenses');
  } else if (hasGaps) {
    summary = `${gapSummary.totalGaps} cash gap(s) detected in the forecast period.`;
    details = `${gapSummary.criticalGaps + gapSummary.highGaps} gaps require immediate attention. ` +
              `The largest projected shortfall is $${gapSummary.largestDeficit.toLocaleString()}.`;
    actions.push('Accelerate collection on high-recovery invoices');
    actions.push('Contact top clients about early payment');
    if (gapSummary.criticalGaps > 0) {
      actions.push('Consider credit line or invoice factoring');
    }
  } else {
    summary = 'Cash flow analysis complete.';
    details = 'Review the detailed projections for more information.';
  }

  return {
    id: `insight-cashflow-${Date.now()}`,
    type: 'cash_flow_warning',
    title: 'Cash Flow Summary',
    summary,
    details,
    priority: determineCashFlowPriority(gapSummary),
    actionable: hasGaps,
    suggestedActions: actions,
    relatedEntityIds: [],
    generatedAt: new Date(),
  };
}

/**
 * Generate insight explaining a client's payment score
 */
export async function generateScoreExplanation(
  score: PaymentBehaviorScore,
  clientName: string
): Promise<AIInsight> {
  if (!isOpenAIConfigured()) {
    return generateTemplateBasedScoreExplanation(score, clientName);
  }

  const prompt = `Explain this client's payment behavior score in plain language.

Client: ${clientName}
Score: ${score.score}/100
Tier: ${score.tier} (${getTierLabel(score.tier)})

Scoring Factors:
- On-time payment rate: ${score.factors.onTimeRate.toFixed(1)}%
- Average days to pay: ${score.factors.avgDaysToPay.toFixed(1)} days from due date
- Payment consistency (variance): ${score.factors.avgDaysVariance.toFixed(1)} days
- Relationship length: ${score.factors.relationshipLengthDays} days
- Total invoices: ${score.factors.totalInvoices}
- Total payments: ${score.factors.totalPayments}

Provide:
1. A brief interpretation of what this score means
2. Key factors affecting the score (positive and negative)
3. One recommendation based on this profile

Keep it concise and actionable.`;

  const response = await generateCompletion(prompt, {
    maxTokens: 350,
    temperature: 0.5,
  });

  return {
    id: `insight-score-${score.clientId}-${Date.now()}`,
    type: 'payment_pattern',
    title: `${clientName} Payment Profile`,
    summary: `Tier ${score.tier} client with ${score.score}/100 payment score`,
    details: response,
    priority: score.tier === 'D' ? 'high' : score.tier === 'C' ? 'medium' : 'low',
    actionable: score.tier === 'C' || score.tier === 'D',
    suggestedActions: extractActions(response),
    relatedEntityIds: [score.clientId],
    generatedAt: new Date(),
  };
}

/**
 * Template-based score explanation
 */
function generateTemplateBasedScoreExplanation(
  score: PaymentBehaviorScore,
  clientName: string
): AIInsight {
  const tierDescriptions: Record<ClientTier, string> = {
    A: 'an excellent payer who consistently pays on time',
    B: 'a reliable payer with occasional delays',
    C: 'a moderate-risk payer who often pays late',
    D: 'a high-risk payer with significant payment issues',
  };

  const details = `${clientName} is ${tierDescriptions[score.tier]}. ` +
    `They have an on-time payment rate of ${score.factors.onTimeRate.toFixed(1)}% ` +
    `and typically pay ${Math.abs(score.factors.avgDaysToPay).toFixed(0)} days ` +
    `${score.factors.avgDaysToPay >= 0 ? 'after' : 'before'} the due date.`;

  const actions: string[] = [];
  if (score.tier === 'D') {
    actions.push('Require upfront payment or deposits');
    actions.push('Shorten payment terms');
  } else if (score.tier === 'C') {
    actions.push('Monitor closely and follow up promptly on overdue invoices');
  }

  return {
    id: `insight-score-${score.clientId}-${Date.now()}`,
    type: 'payment_pattern',
    title: `${clientName} Payment Profile`,
    summary: `Tier ${score.tier} client with ${score.score}/100 payment score`,
    details,
    priority: score.tier === 'D' ? 'high' : score.tier === 'C' ? 'medium' : 'low',
    actionable: score.tier === 'C' || score.tier === 'D',
    suggestedActions: actions,
    relatedEntityIds: [score.clientId],
    generatedAt: new Date(),
  };
}

/**
 * Generate recovery strategy recommendation
 */
export async function generateRecoveryStrategy(
  invoice: { id: string; amount: number; daysOverdue: number },
  recovery: RecoveryLikelihood,
  clientName: string
): Promise<AIInsight> {
  if (!isOpenAIConfigured()) {
    return generateTemplateBasedRecoveryStrategy(invoice, recovery, clientName);
  }

  const prompt = `Recommend a recovery strategy for this overdue invoice.

Invoice ID: ${invoice.id}
Client: ${clientName}
Amount: $${invoice.amount.toLocaleString()}
Days Overdue: ${invoice.daysOverdue}

Recovery Analysis:
- Recovery Likelihood Score: ${recovery.score}/100
- Client Tier: ${recovery.factors.clientTier}
- Has Partial Payment: ${recovery.factors.hasPartialPayment ? 'Yes' : 'No'}
- Recent Contact: ${recovery.factors.recentContact ? 'Yes' : 'No'}

Based on these factors, provide:
1. Recommended immediate action
2. Backup strategy if first approach fails
3. Estimated timeline to resolution

Be specific and practical.`;

  const response = await generateCompletion(prompt, {
    maxTokens: 350,
    temperature: 0.5,
  });

  return {
    id: `insight-recovery-${invoice.id}-${Date.now()}`,
    type: 'collection_opportunity',
    title: `Recovery Strategy: Invoice #${invoice.id}`,
    summary: `${recovery.score}% recovery likelihood for $${invoice.amount.toLocaleString()}`,
    details: response,
    priority: invoice.daysOverdue > 30 ? 'high' : 'medium',
    actionable: true,
    suggestedActions: extractActions(response),
    relatedEntityIds: [invoice.id, recovery.clientId],
    generatedAt: new Date(),
  };
}

/**
 * Template-based recovery strategy
 */
function generateTemplateBasedRecoveryStrategy(
  invoice: { id: string; amount: number; daysOverdue: number },
  recovery: RecoveryLikelihood,
  clientName: string
): AIInsight {
  let strategy: string;
  const actions: string[] = [];

  if (recovery.score >= 70) {
    strategy = `High likelihood of recovery. Send a friendly reminder to ${clientName} and expect payment within 7-10 days.`;
    actions.push('Send email reminder');
    actions.push('Follow up with phone call if no response in 3 days');
  } else if (recovery.score >= 40) {
    strategy = `Moderate recovery likelihood. Direct contact with ${clientName} is recommended. Consider offering a payment plan.`;
    actions.push('Call client directly to discuss payment');
    actions.push('Offer payment plan if needed');
  } else {
    strategy = `Low recovery likelihood. Consider escalation options for this ${invoice.daysOverdue}-day overdue invoice.`;
    actions.push('Send formal demand letter');
    actions.push('Consider collections agency or legal action');
  }

  return {
    id: `insight-recovery-${invoice.id}-${Date.now()}`,
    type: 'collection_opportunity',
    title: `Recovery Strategy: Invoice #${invoice.id}`,
    summary: `${recovery.score}% recovery likelihood for $${invoice.amount.toLocaleString()}`,
    details: strategy,
    priority: invoice.daysOverdue > 30 ? 'high' : 'medium',
    actionable: true,
    suggestedActions: actions,
    relatedEntityIds: [invoice.id, recovery.clientId],
    generatedAt: new Date(),
  };
}

/**
 * Generate cash gap resolution insight
 */
export async function generateGapResolutionInsight(gap: CashGap): Promise<AIInsight> {
  const daysUntil = Math.ceil((gap.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return {
    id: `insight-gap-${gap.id}-${Date.now()}`,
    type: 'cash_flow_warning',
    title: `Cash Gap Alert: ${gap.severity.toUpperCase()}`,
    summary: `$${gap.gapAmount.toLocaleString()} shortfall projected ${daysUntil > 0 ? `in ${daysUntil} days` : 'currently active'}`,
    details: `A ${gap.durationDays}-day cash gap is ${daysUntil > 0 ? 'projected to begin' : 'currently in effect'} ` +
             `with a maximum shortfall of $${gap.gapAmount.toLocaleString()}. ${gap.recommendations[0] || ''}`,
    priority: gap.severity === 'critical' ? 'high' : gap.severity === 'high' ? 'high' : 'medium',
    actionable: true,
    suggestedActions: gap.recommendations.slice(0, 3),
    relatedEntityIds: [gap.id],
    generatedAt: new Date(),
  };
}

// Helper functions

function getTierLabel(tier: ClientTier): string {
  const labels: Record<ClientTier, string> = {
    A: 'Excellent',
    B: 'Good',
    C: 'Fair',
    D: 'Poor',
  };
  return labels[tier];
}

function determineCashFlowPriority(gapSummary: CashGapSummary): 'low' | 'medium' | 'high' {
  if (gapSummary.criticalGaps > 0 || gapSummary.requiresImmediateAction) return 'high';
  if (gapSummary.highGaps > 0 || gapSummary.totalGaps >= 3) return 'medium';
  return 'low';
}

function extractFirstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : text.slice(0, 100) + '...';
}

function extractActions(text: string): string[] {
  // Look for numbered lists or bullet points
  const lines = text.split('\n');
  const actions: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match numbered items or bullet points that look like actions
    if (/^[\d•\-\*]/.test(trimmed) && trimmed.length > 10) {
      const cleaned = trimmed.replace(/^[\d\.\)\-\*•]+\s*/, '');
      if (cleaned.length > 5 && cleaned.length < 200) {
        actions.push(cleaned);
      }
    }
  }

  return actions.slice(0, 5);
}
