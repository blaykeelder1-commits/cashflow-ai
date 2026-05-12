import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating comprehensive $200k/year business demo...');

  // Clean existing data
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

  // Create Organization - $200k/year consulting business
  const org = await prisma.organization.create({
    data: {
      name: 'Mitchell Digital Consulting',
      industry: 'Digital Marketing & Consulting',
      annualRevenueTier: '100k-500k',
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
  console.log('Created user:', user.email);

  // Create 8 Clients with realistic payment behaviors
  const clients = await Promise.all([
    // Tier A - Excellent payers
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'Apex Tech Solutions',
        email: 'billing@apextech.com',
        phone: '+1 (555) 101-1001',
        industry: 'Technology',
        paymentBehaviorScore: 95,
        paymentBehaviorTier: 'A',
        avgDaysToPay: 8,
        totalInvoiced: 48000,
        totalPaid: 48000,
        totalOutstanding: 0,
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'Bright Future Media',
        email: 'accounts@brightfuture.co',
        phone: '+1 (555) 202-2002',
        industry: 'Media & Entertainment',
        paymentBehaviorScore: 92,
        paymentBehaviorTier: 'A',
        avgDaysToPay: 12,
        totalInvoiced: 36000,
        totalPaid: 32000,
        totalOutstanding: 4000,
      },
    }),
    // Tier B - Good payers
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'CloudNine Enterprises',
        email: 'finance@cloudnine.io',
        phone: '+1 (555) 303-3003',
        industry: 'SaaS',
        paymentBehaviorScore: 78,
        paymentBehaviorTier: 'B',
        avgDaysToPay: 22,
        totalInvoiced: 28000,
        totalPaid: 21000,
        totalOutstanding: 7000,
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'DataDriven Inc',
        email: 'ap@datadriven.com',
        phone: '+1 (555) 404-4004',
        industry: 'Analytics',
        paymentBehaviorScore: 74,
        paymentBehaviorTier: 'B',
        avgDaysToPay: 26,
        totalInvoiced: 24000,
        totalPaid: 18000,
        totalOutstanding: 6000,
      },
    }),
    // Tier C - Slower payers
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'EcoGreen Startups',
        email: 'payments@ecogreen.co',
        phone: '+1 (555) 505-5005',
        industry: 'Clean Tech',
        paymentBehaviorScore: 58,
        paymentBehaviorTier: 'C',
        avgDaysToPay: 42,
        totalInvoiced: 18000,
        totalPaid: 12000,
        totalOutstanding: 6000,
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'FastTrack Logistics',
        email: 'billing@fasttrack.net',
        phone: '+1 (555) 606-6006',
        industry: 'Logistics',
        paymentBehaviorScore: 52,
        paymentBehaviorTier: 'C',
        avgDaysToPay: 48,
        totalInvoiced: 22000,
        totalPaid: 14000,
        totalOutstanding: 8000,
      },
    }),
    // Tier D - Problem payers
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'GrowthHack Labs',
        email: 'finance@growthhack.io',
        phone: '+1 (555) 707-7007',
        industry: 'Startup',
        paymentBehaviorScore: 35,
        paymentBehaviorTier: 'D',
        avgDaysToPay: 65,
        totalInvoiced: 15000,
        totalPaid: 8000,
        totalOutstanding: 7000,
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: 'Harbor View Hotels',
        email: 'accounting@harborview.com',
        phone: '+1 (555) 808-8008',
        industry: 'Hospitality',
        paymentBehaviorScore: 42,
        paymentBehaviorTier: 'D',
        avgDaysToPay: 58,
        totalInvoiced: 12000,
        totalPaid: 7000,
        totalOutstanding: 5000,
      },
    }),
  ]);

  console.log(`Created ${clients.length} clients`);

  // Helper to get date offset
  const daysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };

  const daysFromNow = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };

  // Create invoices for each client - mix of paid, pending, overdue
  const invoices = [];

  // Apex Tech - All paid, excellent client
  invoices.push(
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[0].id,
        invoiceNumber: 'INV-2024-001',
        amount: 12000,
        amountPaid: 12000,
        status: 'paid',
        issueDate: daysAgo(90),
        dueDate: daysAgo(60),
        paidDate: daysAgo(65),
      },
    }),
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[0].id,
        invoiceNumber: 'INV-2024-008',
        amount: 12000,
        amountPaid: 12000,
        status: 'paid',
        issueDate: daysAgo(60),
        dueDate: daysAgo(30),
        paidDate: daysAgo(35),
      },
    }),
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[0].id,
        invoiceNumber: 'INV-2024-015',
        amount: 12000,
        amountPaid: 0,
        status: 'pending',
        issueDate: daysAgo(15),
        dueDate: daysFromNow(15),
      },
    })
  );

  // Bright Future Media - Mostly paid, one pending
  invoices.push(
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[1].id,
        invoiceNumber: 'INV-2024-002',
        amount: 8000,
        amountPaid: 8000,
        status: 'paid',
        issueDate: daysAgo(75),
        dueDate: daysAgo(45),
        paidDate: daysAgo(42),
      },
    }),
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[1].id,
        invoiceNumber: 'INV-2024-009',
        amount: 8000,
        amountPaid: 8000,
        status: 'paid',
        issueDate: daysAgo(45),
        dueDate: daysAgo(15),
        paidDate: daysAgo(12),
      },
    }),
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[1].id,
        invoiceNumber: 'INV-2024-016',
        amount: 4000,
        amountPaid: 0,
        status: 'pending',
        issueDate: daysAgo(10),
        dueDate: daysFromNow(20),
      },
    })
  );

  // CloudNine - Mix with one overdue
  invoices.push(
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[2].id,
        invoiceNumber: 'INV-2024-003',
        amount: 7000,
        amountPaid: 7000,
        status: 'paid',
        issueDate: daysAgo(80),
        dueDate: daysAgo(50),
        paidDate: daysAgo(45),
      },
    }),
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[2].id,
        invoiceNumber: 'INV-2024-010',
        amount: 7000,
        amountPaid: 0,
        status: 'overdue',
        issueDate: daysAgo(45),
        dueDate: daysAgo(15),
        daysOverdue: 15,
      },
    })
  );

  // DataDriven - Paid and pending
  invoices.push(
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[3].id,
        invoiceNumber: 'INV-2024-004',
        amount: 6000,
        amountPaid: 6000,
        status: 'paid',
        issueDate: daysAgo(70),
        dueDate: daysAgo(40),
        paidDate: daysAgo(32),
      },
    }),
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[3].id,
        invoiceNumber: 'INV-2024-017',
        amount: 6000,
        amountPaid: 0,
        status: 'pending',
        issueDate: daysAgo(5),
        dueDate: daysFromNow(25),
      },
    })
  );

  // EcoGreen - Overdue issues
  invoices.push(
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[4].id,
        invoiceNumber: 'INV-2024-005',
        amount: 6000,
        amountPaid: 6000,
        status: 'paid',
        issueDate: daysAgo(90),
        dueDate: daysAgo(60),
        paidDate: daysAgo(48),
      },
    }),
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[4].id,
        invoiceNumber: 'INV-2024-011',
        amount: 6000,
        amountPaid: 0,
        status: 'overdue',
        issueDate: daysAgo(50),
        dueDate: daysAgo(20),
        daysOverdue: 20,
      },
    })
  );

  // FastTrack - Multiple overdue
  invoices.push(
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[5].id,
        invoiceNumber: 'INV-2024-006',
        amount: 5500,
        amountPaid: 5500,
        status: 'paid',
        issueDate: daysAgo(85),
        dueDate: daysAgo(55),
        paidDate: daysAgo(40),
      },
    }),
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[5].id,
        invoiceNumber: 'INV-2024-012',
        amount: 5500,
        amountPaid: 0,
        status: 'overdue',
        issueDate: daysAgo(55),
        dueDate: daysAgo(25),
        daysOverdue: 25,
      },
    }),
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[5].id,
        invoiceNumber: 'INV-2024-018',
        amount: 2500,
        amountPaid: 0,
        status: 'overdue',
        issueDate: daysAgo(40),
        dueDate: daysAgo(10),
        daysOverdue: 10,
      },
    })
  );

  // GrowthHack - Problematic
  invoices.push(
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[6].id,
        invoiceNumber: 'INV-2024-007',
        amount: 5000,
        amountPaid: 5000,
        status: 'paid',
        issueDate: daysAgo(100),
        dueDate: daysAgo(70),
        paidDate: daysAgo(45),
      },
    }),
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[6].id,
        invoiceNumber: 'INV-2024-013',
        amount: 5000,
        amountPaid: 0,
        status: 'overdue',
        issueDate: daysAgo(60),
        dueDate: daysAgo(30),
        daysOverdue: 30,
      },
    }),
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[6].id,
        invoiceNumber: 'INV-2024-019',
        amount: 2000,
        amountPaid: 0,
        status: 'overdue',
        issueDate: daysAgo(45),
        dueDate: daysAgo(15),
        daysOverdue: 15,
      },
    })
  );

  // Harbor View - Slow but paying
  invoices.push(
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[7].id,
        invoiceNumber: 'INV-2024-014',
        amount: 4000,
        amountPaid: 4000,
        status: 'paid',
        issueDate: daysAgo(75),
        dueDate: daysAgo(45),
        paidDate: daysAgo(25),
      },
    }),
    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        clientId: clients[7].id,
        invoiceNumber: 'INV-2024-020',
        amount: 5000,
        amountPaid: 0,
        status: 'overdue',
        issueDate: daysAgo(35),
        dueDate: daysAgo(5),
        daysOverdue: 5,
      },
    })
  );

  console.log(`Created ${invoices.length} invoices`);

  // Create cash flow snapshot
  await prisma.cashFlowSnapshot.create({
    data: {
      organizationId: org.id,
      snapshotDate: new Date(),
      totalReceivables: 43000,
      totalOverdue: 38000,
      overdue30Days: 20000,
      overdue60Days: 18000,
      overdue90PlusDays: 0,
      forecast7Day: 12000,
      forecast14Day: 22000,
      forecast30Day: 35000,
    },
  });
  console.log('Created cash flow snapshot');

  // Create AI Recommendations
  await Promise.all([
    prisma.aIRecommendation.create({
      data: {
        organizationId: org.id,
        clientId: clients[6].id,
        recommendationType: 'escalate',
        recommendationText: 'GrowthHack Labs has $7,000 overdue (45+ days). Consider offering a payment plan or escalating to collections.',
        confidenceScore: 0.89,
        reasoning: 'Client has D-tier payment behavior with 65 avg days to pay. Two invoices overdue.',
        status: 'pending',
      },
    }),
    prisma.aIRecommendation.create({
      data: {
        organizationId: org.id,
        clientId: clients[5].id,
        recommendationType: 'follow_up',
        recommendationText: 'Contact FastTrack Logistics immediately - two invoices totaling $8,000 are overdue.',
        confidenceScore: 0.92,
        reasoning: 'Client has history of late payments. Phone call recommended based on past success.',
        status: 'pending',
      },
    }),
    prisma.aIRecommendation.create({
      data: {
        organizationId: org.id,
        clientId: clients[0].id,
        recommendationType: 'prioritize',
        recommendationText: 'Consider annual retainer for Apex Tech - your best client with 95% payment score.',
        confidenceScore: 0.85,
        reasoning: 'This client pays early consistently. Annual contract could improve cash flow predictability.',
        status: 'pending',
      },
    }),
    prisma.aIRecommendation.create({
      data: {
        organizationId: org.id,
        recommendationType: 'deprioritize',
        recommendationText: 'Review payment terms for Tier D clients - require deposits or shorter terms.',
        confidenceScore: 0.78,
        reasoning: 'GrowthHack Labs and Harbor View Hotels account for 28% of overdue balance.',
        status: 'pending',
      },
    }),
  ]);
  console.log('Created AI recommendations');

  // Create follow-up actions
  await Promise.all([
    prisma.followUpAction.create({
      data: {
        organizationId: org.id,
        clientId: clients[6].id,
        actionType: 'call',
        actionDate: new Date(),
        notes: 'Call to discuss payment plan for overdue invoices',
        nextActionDate: daysFromNow(1),
      },
    }),
    prisma.followUpAction.create({
      data: {
        organizationId: org.id,
        clientId: clients[5].id,
        actionType: 'email',
        actionDate: new Date(),
        notes: 'Send payment reminder for INV-2024-012 and INV-2024-018',
        nextActionDate: daysFromNow(2),
      },
    }),
    prisma.followUpAction.create({
      data: {
        organizationId: org.id,
        clientId: clients[2].id,
        actionType: 'email',
        actionDate: new Date(),
        notes: 'Friendly reminder for Website Redesign Phase 2 invoice',
        nextActionDate: daysFromNow(3),
      },
    }),
  ]);
  console.log('Created follow-up actions');

  console.log('\n========================================');
  console.log('$200K BUSINESS DEMO DATA CREATED');
  console.log('========================================\n');
  console.log('Business: Mitchell Digital Consulting');
  console.log('Owner: Sarah Mitchell (sarah@techflow.io)');
  console.log('Password: demo123\n');
  console.log('Annual Revenue Target: $200,000');
  console.log('Total Invoiced (YTD): $203,000');
  console.log('Total Collected: $160,000');
  console.log('Outstanding: $43,000');
  console.log('Overdue: $38,000');
  console.log(`\nClients: ${clients.length}`);
  console.log(`Invoices: ${invoices.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
