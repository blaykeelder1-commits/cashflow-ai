import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with demo data...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.aIRecommendation.deleteMany();
  await prisma.cashFlowSnapshot.deleteMany();
  await prisma.followUpAction.deleteMany();
  await prisma.invoicePayment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('Cleared existing data');

  // Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'TechFlow Solutions',
      industry: 'Software Consulting',
      annualRevenueTier: '500k-1m',
      timezone: 'America/New_York',
      currency: 'USD',
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
    },
  });
  console.log('Created organization:', org.name);

  // Create User (password: demo123)
  const passwordHash = await bcrypt.hash('demo123', 10);
  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'sarah@techflow.io',
      passwordHash,
      fullName: 'Sarah Mitchell',
      role: 'owner',
      authProvider: 'email',
    },
  });
  console.log('Created user:', user.email, '(password: demo123)');

  // Create Clients with different payment behaviors
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'Acme Corporation',
        email: 'billing@acme.com',
        phone: '+1 (555) 100-1000',
        paymentBehaviorScore: 92,
        paymentBehaviorTier: 'A',
        avgDaysToPay: 12.5,
        totalInvoiced: 45000,
        totalPaid: 45000,
        totalOutstanding: 0,
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'GlobalTech Inc',
        email: 'accounts@globaltech.com',
        phone: '+1 (555) 200-2000',
        paymentBehaviorScore: 72,
        paymentBehaviorTier: 'B',
        avgDaysToPay: 28.3,
        totalInvoiced: 32000,
        totalPaid: 24000,
        totalOutstanding: 8000,
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'Metro Design Studio',
        email: 'finance@metrodesign.co',
        phone: '+1 (555) 300-3000',
        paymentBehaviorScore: 45,
        paymentBehaviorTier: 'C',
        avgDaysToPay: 52.7,
        totalInvoiced: 28500,
        totalPaid: 22000,
        totalOutstanding: 6500,
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'StartupX Labs',
        email: 'pay@startupx.io',
        phone: '+1 (555) 400-4000',
        paymentBehaviorScore: 28,
        paymentBehaviorTier: 'D',
        avgDaysToPay: 78.2,
        totalInvoiced: 18000,
        totalPaid: 12500,
        totalOutstanding: 5500,
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'Bright Ideas LLC',
        email: 'invoices@brightideas.com',
        phone: '+1 (555) 500-5000',
        paymentBehaviorScore: 68,
        paymentBehaviorTier: 'B',
        avgDaysToPay: 31.0,
        totalInvoiced: 22000,
        totalPaid: 22000,
        totalOutstanding: 0,
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'Summit Consulting Group',
        email: 'ap@summitconsulting.com',
        phone: '+1 (555) 600-6000',
        paymentBehaviorScore: 85,
        paymentBehaviorTier: 'A',
        avgDaysToPay: 18.5,
        totalInvoiced: 38000,
        totalPaid: 38000,
        totalOutstanding: 0,
      },
    }),
  ]);
  console.log('Created', clients.length, 'clients');

  // Helper to get date X days ago
  const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  const daysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  // Create Invoices - mix of statuses totaling ~$20k outstanding
  const invoices = await Promise.all([
    // Acme Corp - all paid (good client)
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[0].id,
        invoiceNumber: 'INV-001',
        amount: 15000,
        amountPaid: 15000,
        issueDate: daysAgo(45),
        dueDate: daysAgo(15),
        paidDate: daysAgo(18),
        status: 'paid',
        daysOverdue: 0,
        recoveryLikelihoodScore: 100,
      },
    }),

    // GlobalTech Inc - $8k outstanding, one overdue
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[1].id,
        invoiceNumber: 'INV-002',
        amount: 12000,
        amountPaid: 12000,
        issueDate: daysAgo(60),
        dueDate: daysAgo(30),
        paidDate: daysAgo(25),
        status: 'paid',
        daysOverdue: 0,
        recoveryLikelihoodScore: 100,
      },
    }),
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[1].id,
        invoiceNumber: 'INV-008',
        amount: 8000,
        amountPaid: 0,
        issueDate: daysAgo(25),
        dueDate: daysAgo(5),
        status: 'overdue',
        daysOverdue: 5,
        recoveryLikelihoodScore: 78,
        predictedPaymentDate: daysFromNow(8),
        recommendedAction: 'Send reminder email',
        recommendedActionDate: new Date(),
      },
    }),

    // Metro Design - $6.5k outstanding, seriously overdue
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[2].id,
        invoiceNumber: 'INV-003',
        amount: 8500,
        amountPaid: 8500,
        issueDate: daysAgo(90),
        dueDate: daysAgo(60),
        paidDate: daysAgo(45),
        status: 'paid',
        daysOverdue: 0,
        recoveryLikelihoodScore: 100,
      },
    }),
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[2].id,
        invoiceNumber: 'INV-009',
        amount: 4000,
        amountPaid: 0,
        issueDate: daysAgo(50),
        dueDate: daysAgo(20),
        status: 'overdue',
        daysOverdue: 20,
        recoveryLikelihoodScore: 55,
        predictedPaymentDate: daysFromNow(25),
        recommendedAction: 'Schedule call with client',
        recommendedActionDate: daysFromNow(2),
      },
    }),
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[2].id,
        invoiceNumber: 'INV-012',
        amount: 2500,
        amountPaid: 0,
        issueDate: daysAgo(15),
        dueDate: daysFromNow(15),
        status: 'pending',
        daysOverdue: 0,
        recoveryLikelihoodScore: 62,
        predictedPaymentDate: daysFromNow(35),
      },
    }),

    // StartupX Labs - $5.5k outstanding, high risk
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[3].id,
        invoiceNumber: 'INV-004',
        amount: 6000,
        amountPaid: 6000,
        issueDate: daysAgo(120),
        dueDate: daysAgo(90),
        paidDate: daysAgo(55),
        status: 'paid',
        daysOverdue: 0,
        recoveryLikelihoodScore: 100,
      },
    }),
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[3].id,
        invoiceNumber: 'INV-010',
        amount: 3500,
        amountPaid: 0,
        issueDate: daysAgo(75),
        dueDate: daysAgo(45),
        status: 'overdue',
        daysOverdue: 45,
        recoveryLikelihoodScore: 32,
        predictedPaymentDate: daysFromNow(40),
        recommendedAction: 'Escalate to collections consideration',
        recommendedActionDate: new Date(),
      },
    }),
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[3].id,
        invoiceNumber: 'INV-011',
        amount: 2000,
        amountPaid: 0,
        issueDate: daysAgo(40),
        dueDate: daysAgo(10),
        status: 'overdue',
        daysOverdue: 10,
        recoveryLikelihoodScore: 45,
        predictedPaymentDate: daysFromNow(50),
        recommendedAction: 'Final payment reminder',
        recommendedActionDate: daysFromNow(3),
      },
    }),

    // Bright Ideas LLC - all paid (good recent history)
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[4].id,
        invoiceNumber: 'INV-005',
        amount: 11000,
        amountPaid: 11000,
        issueDate: daysAgo(50),
        dueDate: daysAgo(20),
        paidDate: daysAgo(8),
        status: 'paid',
        daysOverdue: 0,
        recoveryLikelihoodScore: 100,
      },
    }),

    // Summit Consulting - all paid (reliable)
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[5].id,
        invoiceNumber: 'INV-006',
        amount: 18000,
        amountPaid: 18000,
        issueDate: daysAgo(40),
        dueDate: daysAgo(10),
        paidDate: daysAgo(12),
        status: 'paid',
        daysOverdue: 0,
        recoveryLikelihoodScore: 100,
      },
    }),
    prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[5].id,
        invoiceNumber: 'INV-007',
        amount: 20000,
        amountPaid: 20000,
        issueDate: daysAgo(70),
        dueDate: daysAgo(40),
        paidDate: daysAgo(42),
        status: 'paid',
        daysOverdue: 0,
        recoveryLikelihoodScore: 100,
      },
    }),
  ]);
  console.log('Created', invoices.length, 'invoices');

  // Calculate totals
  const totalOutstanding = 8000 + 4000 + 2500 + 3500 + 2000; // = $20,000
  console.log('Total outstanding:', '$' + totalOutstanding.toLocaleString());

  // Create Cash Flow Snapshot
  await prisma.cashFlowSnapshot.create({
    data: {
      organizationId: org.id,
      snapshotDate: new Date(),
      totalReceivables: totalOutstanding,
      totalOverdue: 8000 + 4000 + 3500 + 2000, // = $17,500
      overdue30Days: 8000 + 4000, // = $12,000 (under 30 days)
      overdue60Days: 3500 + 2000, // = $5,500 (30-60 days)
      overdue90PlusDays: 0,
      forecast7Day: 3200, // Expected payments in 7 days
      forecast14Day: 8500, // Expected payments in 14 days
      forecast30Day: 14200, // Expected payments in 30 days
      predictedGapDate: daysFromNow(18), // Potential cash gap
      predictedGapAmount: 5500, // Amount short
    },
  });
  console.log('Created cash flow snapshot');

  // Create AI Recommendations
  await Promise.all([
    prisma.aIRecommendation.create({
      data: {
        organizationId: org.id,
        clientId: clients[3].id,
        recommendationType: 'escalate',
        recommendationText: 'StartupX Labs has 2 overdue invoices totaling $5,500 with payment history showing 78+ day average delays. Consider escalating to formal collection process.',
        confidenceScore: 0.87,
        reasoning: 'Client payment behavior score is 28 (D-tier). Historical data shows consistent late payments averaging 78 days past due.',
        status: 'pending',
        expiresAt: daysFromNow(7),
      },
    }),
    prisma.aIRecommendation.create({
      data: {
        organizationId: org.id,
        clientId: clients[2].id,
        invoiceId: invoices[4].id,
        recommendationType: 'follow_up',
        recommendationText: 'Metro Design Studio\'s Invoice #INV-009 is 20 days overdue. Based on their payment pattern, a personal phone call is 3x more effective than email.',
        confidenceScore: 0.75,
        reasoning: 'Client responds better to direct communication. Previous phone follow-ups resulted in payment within 5 days.',
        status: 'pending',
        expiresAt: daysFromNow(5),
      },
    }),
    prisma.aIRecommendation.create({
      data: {
        organizationId: org.id,
        clientId: clients[1].id,
        invoiceId: invoices[2].id,
        recommendationType: 'follow_up',
        recommendationText: 'GlobalTech Inc usually pays within 28 days. Invoice #INV-008 is only 5 days overdue. Send a friendly reminder email - high likelihood of payment this week.',
        confidenceScore: 0.92,
        reasoning: 'Client has B-tier payment score (72) with consistent payment pattern. Minor delay likely due to processing.',
        status: 'pending',
        expiresAt: daysFromNow(3),
      },
    }),
    prisma.aIRecommendation.create({
      data: {
        organizationId: org.id,
        recommendationType: 'prioritize',
        recommendationText: 'Cash flow alert: Based on current receivables and payment predictions, you may experience a $5,500 shortfall around January 28th. Prioritize collection on StartupX Labs invoices.',
        confidenceScore: 0.82,
        reasoning: 'Forecast model predicts incoming payments won\'t cover upcoming expenses. StartupX Labs represents largest at-risk receivable.',
        status: 'pending',
        expiresAt: daysFromNow(14),
      },
    }),
  ]);
  console.log('Created AI recommendations');

  // Create some follow-up actions history
  await Promise.all([
    prisma.followUpAction.create({
      data: {
        organizationId: org.id,
        invoiceId: invoices[7].id, // StartupX overdue invoice
        clientId: clients[3].id,
        userId: user.id,
        actionType: 'email',
        actionDate: daysAgo(30),
        notes: 'Sent initial reminder for overdue invoice',
        outcome: 'no_response',
        nextActionDate: daysAgo(20),
      },
    }),
    prisma.followUpAction.create({
      data: {
        organizationId: org.id,
        invoiceId: invoices[7].id,
        clientId: clients[3].id,
        userId: user.id,
        actionType: 'email',
        actionDate: daysAgo(20),
        notes: 'Second reminder sent',
        outcome: 'no_response',
        nextActionDate: daysAgo(10),
      },
    }),
    prisma.followUpAction.create({
      data: {
        organizationId: org.id,
        invoiceId: invoices[7].id,
        clientId: clients[3].id,
        userId: user.id,
        actionType: 'call',
        actionDate: daysAgo(10),
        notes: 'Called CFO, said they are having cash flow issues. Promised payment by end of month.',
        outcome: 'promised_payment',
        nextActionDate: daysFromNow(5),
      },
    }),
    prisma.followUpAction.create({
      data: {
        organizationId: org.id,
        invoiceId: invoices[4].id, // Metro Design overdue
        clientId: clients[2].id,
        userId: user.id,
        actionType: 'email',
        actionDate: daysAgo(7),
        notes: 'Reminder for Invoice #INV-009',
        outcome: 'no_response',
        nextActionDate: daysFromNow(3),
      },
    }),
  ]);
  console.log('Created follow-up actions');

  // ================================================
  // PHASE 2 DATA INTELLIGENCE SEED DATA
  // ================================================

  console.log('Creating Phase 2 learning data...');

  // Clean Phase 2 tables first
  await prisma.communicationEffectiveness.deleteMany();
  await prisma.clientSeasonalPattern.deleteMany();
  await prisma.economicIndicator.deleteMany();
  await prisma.industryBenchmark.deleteMany();

  // 1. Industry Benchmarks (15 industries)
  await prisma.industryBenchmark.createMany({
    data: [
      {
        industry: 'technology',
        avgDaysToPay: 32.0,
        medianDaysToPay: 28.0,
        stdDevDaysToPay: 12.5,
        pctPayOnTime: 0.72,
        pctPay30Days: 0.85,
        pctPay60Days: 0.94,
        pctPay90Plus: 0.06,
        seasonalMultipliers: JSON.stringify({ Q1: 0.9, Q2: 0.95, Q3: 1.0, Q4: 1.15 }),
        economicSensitivity: 1.1,
        sampleSize: 10000,
      },
      {
        industry: 'healthcare',
        avgDaysToPay: 45.0,
        medianDaysToPay: 42.0,
        stdDevDaysToPay: 18.0,
        pctPayOnTime: 0.58,
        pctPay30Days: 0.72,
        pctPay60Days: 0.88,
        pctPay90Plus: 0.12,
        seasonalMultipliers: JSON.stringify({ Q1: 1.0, Q2: 1.0, Q3: 0.95, Q4: 1.05 }),
        economicSensitivity: 0.7,
        sampleSize: 8500,
      },
      {
        industry: 'manufacturing',
        avgDaysToPay: 42.0,
        medianDaysToPay: 38.0,
        stdDevDaysToPay: 15.0,
        pctPayOnTime: 0.62,
        pctPay30Days: 0.78,
        pctPay60Days: 0.91,
        pctPay90Plus: 0.09,
        seasonalMultipliers: JSON.stringify({ Q1: 0.95, Q2: 1.05, Q3: 1.0, Q4: 1.0 }),
        economicSensitivity: 1.3,
        sampleSize: 12000,
      },
      {
        industry: 'retail',
        avgDaysToPay: 28.0,
        medianDaysToPay: 25.0,
        stdDevDaysToPay: 10.0,
        pctPayOnTime: 0.75,
        pctPay30Days: 0.88,
        pctPay60Days: 0.95,
        pctPay90Plus: 0.05,
        seasonalMultipliers: JSON.stringify({ Q1: 0.85, Q2: 0.95, Q3: 1.0, Q4: 1.2 }),
        economicSensitivity: 1.4,
        sampleSize: 15000,
      },
      {
        industry: 'construction',
        avgDaysToPay: 52.0,
        medianDaysToPay: 48.0,
        stdDevDaysToPay: 22.0,
        pctPayOnTime: 0.48,
        pctPay30Days: 0.65,
        pctPay60Days: 0.82,
        pctPay90Plus: 0.18,
        seasonalMultipliers: JSON.stringify({ Q1: 0.8, Q2: 1.1, Q3: 1.15, Q4: 0.95 }),
        economicSensitivity: 1.5,
        sampleSize: 9000,
      },
      {
        industry: 'professional_services',
        avgDaysToPay: 35.0,
        medianDaysToPay: 30.0,
        stdDevDaysToPay: 14.0,
        pctPayOnTime: 0.68,
        pctPay30Days: 0.82,
        pctPay60Days: 0.93,
        pctPay90Plus: 0.07,
        seasonalMultipliers: JSON.stringify({ Q1: 0.95, Q2: 1.0, Q3: 1.0, Q4: 1.05 }),
        economicSensitivity: 1.0,
        sampleSize: 11000,
      },
      {
        industry: 'financial_services',
        avgDaysToPay: 25.0,
        medianDaysToPay: 22.0,
        stdDevDaysToPay: 8.0,
        pctPayOnTime: 0.82,
        pctPay30Days: 0.92,
        pctPay60Days: 0.97,
        pctPay90Plus: 0.03,
        seasonalMultipliers: JSON.stringify({ Q1: 0.95, Q2: 1.0, Q3: 1.0, Q4: 1.05 }),
        economicSensitivity: 0.9,
        sampleSize: 7000,
      },
      {
        industry: 'transportation',
        avgDaysToPay: 38.0,
        medianDaysToPay: 35.0,
        stdDevDaysToPay: 13.0,
        pctPayOnTime: 0.65,
        pctPay30Days: 0.80,
        pctPay60Days: 0.92,
        pctPay90Plus: 0.08,
        seasonalMultipliers: JSON.stringify({ Q1: 0.95, Q2: 1.0, Q3: 1.0, Q4: 1.05 }),
        economicSensitivity: 1.2,
        sampleSize: 6500,
      },
      {
        industry: 'real_estate',
        avgDaysToPay: 40.0,
        medianDaysToPay: 36.0,
        stdDevDaysToPay: 16.0,
        pctPayOnTime: 0.60,
        pctPay30Days: 0.76,
        pctPay60Days: 0.89,
        pctPay90Plus: 0.11,
        seasonalMultipliers: JSON.stringify({ Q1: 0.95, Q2: 1.0, Q3: 1.0, Q4: 1.05 }),
        economicSensitivity: 1.4,
        sampleSize: 5500,
      },
      {
        industry: 'education',
        avgDaysToPay: 48.0,
        medianDaysToPay: 45.0,
        stdDevDaysToPay: 20.0,
        pctPayOnTime: 0.52,
        pctPay30Days: 0.68,
        pctPay60Days: 0.85,
        pctPay90Plus: 0.15,
        seasonalMultipliers: JSON.stringify({ Q1: 0.9, Q2: 1.05, Q3: 0.85, Q4: 1.2 }),
        economicSensitivity: 0.6,
        sampleSize: 4000,
      },
      {
        industry: 'hospitality',
        avgDaysToPay: 30.0,
        medianDaysToPay: 28.0,
        stdDevDaysToPay: 11.0,
        pctPayOnTime: 0.70,
        pctPay30Days: 0.85,
        pctPay60Days: 0.94,
        pctPay90Plus: 0.06,
        seasonalMultipliers: JSON.stringify({ Q1: 0.85, Q2: 0.95, Q3: 1.0, Q4: 1.2 }),
        economicSensitivity: 1.6,
        sampleSize: 7500,
      },
      {
        industry: 'media_entertainment',
        avgDaysToPay: 55.0,
        medianDaysToPay: 50.0,
        stdDevDaysToPay: 25.0,
        pctPayOnTime: 0.45,
        pctPay30Days: 0.62,
        pctPay60Days: 0.80,
        pctPay90Plus: 0.20,
        seasonalMultipliers: JSON.stringify({ Q1: 0.95, Q2: 1.0, Q3: 1.0, Q4: 1.05 }),
        economicSensitivity: 1.3,
        sampleSize: 3500,
      },
      {
        industry: 'energy',
        avgDaysToPay: 38.0,
        medianDaysToPay: 35.0,
        stdDevDaysToPay: 14.0,
        pctPayOnTime: 0.68,
        pctPay30Days: 0.82,
        pctPay60Days: 0.93,
        pctPay90Plus: 0.07,
        seasonalMultipliers: JSON.stringify({ Q1: 0.95, Q2: 1.0, Q3: 1.0, Q4: 1.05 }),
        economicSensitivity: 1.0,
        sampleSize: 5000,
      },
      {
        industry: 'government',
        avgDaysToPay: 60.0,
        medianDaysToPay: 55.0,
        stdDevDaysToPay: 22.0,
        pctPayOnTime: 0.40,
        pctPay30Days: 0.55,
        pctPay60Days: 0.75,
        pctPay90Plus: 0.25,
        seasonalMultipliers: JSON.stringify({ Q1: 0.8, Q2: 1.0, Q3: 1.0, Q4: 1.2 }),
        economicSensitivity: 0.3,
        sampleSize: 6000,
      },
      {
        industry: 'nonprofit',
        avgDaysToPay: 50.0,
        medianDaysToPay: 45.0,
        stdDevDaysToPay: 20.0,
        pctPayOnTime: 0.50,
        pctPay30Days: 0.68,
        pctPay60Days: 0.85,
        pctPay90Plus: 0.15,
        seasonalMultipliers: JSON.stringify({ Q1: 0.9, Q2: 0.95, Q3: 0.95, Q4: 1.2 }),
        economicSensitivity: 0.8,
        sampleSize: 3000,
      },
    ],
  });
  console.log('Created 15 industry benchmarks');

  // 2. Economic Indicators (12 months historical)
  const economicIndicators = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);

    // Slightly varying economic conditions over the year
    const seasonalFactor = Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.1;

    economicIndicators.push({
      indicatorDate: date,
      fedFundsRate: 5.25 + seasonalFactor * 0.25,
      unemploymentRate: 3.8 + seasonalFactor * 0.3,
      inflationRate: 3.2 - seasonalFactor * 0.2,
      gdpGrowthRate: 2.1 + seasonalFactor * 0.5,
      consumerConfidence: 102 - seasonalFactor * 5,
      businessConfidence: 51.5 + seasonalFactor * 2,
      creditAvailability: 65 - seasonalFactor * 3,
      supplyChainStress: 25 + seasonalFactor * 5,
      paymentImpactScore: 0.05 - seasonalFactor * 0.1,
      source: 'mock',
    });
  }
  await prisma.economicIndicator.createMany({ data: economicIndicators });
  console.log('Created 12 months of economic indicators');

  // 3. Client Seasonal Patterns (for existing demo clients)
  const seasonalPatterns = clients.map((client, index) => {
    // Different patterns for different client tiers
    const basePattern = index < 2 ? 1.0 : index < 4 ? 0.95 : 0.9;
    return {
      clientId: client.id,
      januaryMultiplier: basePattern * 0.85,
      februaryMultiplier: basePattern * 0.9,
      marchMultiplier: basePattern * 0.95,
      aprilMultiplier: basePattern * 1.0,
      mayMultiplier: basePattern * 1.02,
      juneMultiplier: basePattern * 1.05,
      julyMultiplier: basePattern * 0.98,
      augustMultiplier: basePattern * 0.95,
      septemberMultiplier: basePattern * 1.0,
      octoberMultiplier: basePattern * 1.05,
      novemberMultiplier: basePattern * 1.1,
      decemberMultiplier: basePattern * 1.15,
      q1Multiplier: basePattern * 0.9,
      q2Multiplier: basePattern * 1.02,
      q3Multiplier: basePattern * 0.98,
      q4Multiplier: basePattern * 1.1,
      dataPoints: 24 + index * 6,
      confidenceScore: 0.7 + index * 0.03,
    };
  });
  await prisma.clientSeasonalPattern.createMany({ data: seasonalPatterns });
  console.log('Created seasonal patterns for', clients.length, 'clients');

  // 4. Communication Effectiveness (by tier and action type)
  const tiers = ['A', 'B', 'C', 'D'];
  const actionTypes = ['email', 'call', 'sms'];
  const effectivenessData = [];

  for (const tier of tiers) {
    for (const actionType of actionTypes) {
      // Different effectiveness rates by tier
      const baseRate = tier === 'A' ? 0.25 : tier === 'B' ? 0.18 : tier === 'C' ? 0.12 : 0.08;
      const emailBonus = actionType === 'email' ? 0.05 : 0;
      const callBonus = actionType === 'call' ? 0.08 : 0;

      effectivenessData.push({
        organizationId: org.id,
        clientTier: tier,
        industry: null, // Aggregate across industries
        actionType,
        sundayRate: (baseRate + emailBonus) * 0.3,
        mondayRate: (baseRate + emailBonus + callBonus) * 0.9,
        tuesdayRate: (baseRate + emailBonus + callBonus) * 1.1,
        wednesdayRate: (baseRate + emailBonus + callBonus) * 1.15,
        thursdayRate: (baseRate + emailBonus + callBonus) * 1.0,
        fridayRate: (baseRate + emailBonus + callBonus) * 0.85,
        saturdayRate: (baseRate + emailBonus) * 0.4,
        hourlyRates: JSON.stringify({
          '9': baseRate * 0.9,
          '10': baseRate * 1.1,
          '11': baseRate * 1.0,
          '14': baseRate * 0.95,
          '15': baseRate * 0.9,
          '16': baseRate * 0.8,
        }),
        bestDay: 'wednesday',
        bestHour: 10,
        bestDayHourRate: (baseRate + emailBonus + callBonus) * 1.2,
        totalAttempts: 100 + Math.floor(Math.random() * 200),
        successfulAttempts: Math.floor((baseRate + emailBonus + callBonus) * (100 + Math.floor(Math.random() * 200))),
      });
    }
  }
  await prisma.communicationEffectiveness.createMany({ data: effectivenessData });
  console.log('Created communication effectiveness data for', effectivenessData.length, 'tier/action combinations');

  console.log('\n========================================');
  console.log('Demo data created successfully!');
  console.log('========================================');
  console.log('\nLogin credentials:');
  console.log('  Email: sarah@techflow.io');
  console.log('  Password: demo123');
  console.log('\nBusiness: TechFlow Solutions');
  console.log('Outstanding invoices: $20,000');
  console.log('Overdue amount: $17,500');
  console.log('\nPhase 2 Data:');
  console.log('  - 15 industry benchmarks');
  console.log('  - 12 months economic indicators');
  console.log('  - Seasonal patterns for all clients');
  console.log('  - Communication effectiveness by tier');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
