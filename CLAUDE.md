# CLAUDE.md - Cashflow AI

> This file helps Claude understand the project and avoid repeated mistakes.

## Project Overview

**Cashflow AI** is a B2B SaaS Cash Flow Intelligence Platform that helps businesses track invoices, predict cash flow, and get AI-powered recommendations for follow-up actions.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth v4 with @auth/prisma-adapter
- **Styling**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Data Fetching**: @tanstack/react-query
- **AI**: OpenAI API
- **Charts**: Recharts
- **Validation**: Zod
- **Deployment**: Vercel

## Project Structure

```
cashflow-ai/
├── src/
│   ├── app/           # Next.js App Router (pages, API routes, layouts)
│   ├── components/    # React components (shadcn/ui based)
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utilities (db client, auth config, helpers)
├── prisma/
│   └── schema.prisma  # Database schema (340 lines)
├── public/            # Static assets
└── package.json
```

## Common Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma generate  # Generate Prisma client after schema changes
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open Prisma Studio GUI
npx prisma migrate dev --name <name>  # Create migration
```

## Architecture & Conventions

### Multi-Tenant Architecture
- All data is scoped to an `Organization`
- Users belong to an Organization via `organizationId`
- Always filter queries by `organizationId` for data isolation

### User Roles
```typescript
type Role = 'owner' | 'admin' | 'analyst' | 'viewer'
```
- **owner**: Full access, can delete organization
- **admin**: Full access except org deletion
- **analyst**: Can view and analyze, limited writes
- **viewer**: Read-only access

### Database Models (Core)
- `Organization` - Tenant with subscription info
- `User` - Auth with role-based access
- `Client` - Customer of the organization
- `Invoice` - With amounts, dates, payment status
- `Integration` - Accounting system connections (QuickBooks, etc.)
- `CashFlowSnapshot` - Point-in-time cash flow data
- `AIRecommendation` - AI-generated suggestions
- `FollowUpAction` - Tasks for invoice follow-up
- `AuditLog` - Activity tracking

### External IDs
Many models have `externalId` for syncing with accounting systems. Never generate these - they come from integrations.

## Code Style Guidelines

### TypeScript
- Use strict TypeScript - no `any` types
- Define interfaces for all API responses
- Use Zod schemas for runtime validation

### React Components
- Use functional components with hooks
- Prefer shadcn/ui components over custom implementations
- Use `cn()` utility for conditional classNames (from `lib/utils`)

### API Routes (App Router)
```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Always scope by organizationId
  const data = await prisma.client.findMany({
    where: { organizationId: session.user.organizationId }
  })
  return NextResponse.json(data)
}
```

### Prisma Queries
- Always include `organizationId` in WHERE clauses
- Use `select` to limit returned fields when possible
- Use transactions for multi-step operations

## Anti-Patterns (DO NOT DO)

### Security
- NEVER expose data without checking `organizationId`
- NEVER trust client-side role checks alone - verify server-side
- NEVER log sensitive data (passwords, tokens, PII)
- NEVER commit `.env` files

### Database
- NEVER use raw SQL - use Prisma's query builder
- NEVER delete data without soft-delete consideration
- NEVER skip `organizationId` in queries (data leakage risk)

### TypeScript
- NEVER use `// @ts-ignore` - fix the type instead
- NEVER use `as any` casting
- NEVER leave unused variables (ESLint will catch this)

### Next.js
- NEVER use `getServerSideProps` - we use App Router
- NEVER import server-only code in client components
- NEVER expose API keys in client-side code

## Environment Variables

Required in `.env`:
```
DATABASE_URL=           # PostgreSQL connection string
NEXTAUTH_SECRET=        # Random secret for NextAuth
NEXTAUTH_URL=           # App URL (http://localhost:3000 in dev)
OPENAI_API_KEY=         # For AI recommendations
```

## Testing Checklist

Before submitting changes:
1. [ ] `npm run lint` passes
2. [ ] `npm run build` succeeds
3. [ ] Tested locally with `npm run dev`
4. [ ] API routes check authentication
5. [ ] Database queries scope by organizationId
6. [ ] No TypeScript errors
7. [ ] No console.log statements left in code

## Common Mistakes Claude Has Made

<!-- Add entries here when Claude makes mistakes -->

1. **Forgetting organizationId scope** - Always filter by organizationId
2. **Using old Pages Router patterns** - This project uses App Router only
3. **Not awaiting async operations** - Prisma calls are async, always await

## Verification Commands

Run these to verify your changes work:
```bash
npm run lint && npm run build
```

If the build passes, the code is ready for PR.
