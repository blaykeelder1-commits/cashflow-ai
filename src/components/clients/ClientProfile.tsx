"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClientProfileProps {
  clientId: string;
}

// Mock client data
const getClient = (id: string) => ({
  id,
  name: "Global Solutions",
  initials: "GS",
  email: "billing@globalsolutions.com",
  phone: "+1 (555) 123-4567",
  address: "123 Business Ave, Suite 100\nNew York, NY 10001",
  website: "www.globalsolutions.com",
  contactPerson: "Sarah Johnson",
  riskScore: "low" as const,
  stats: {
    totalReceivables: 15000,
    overdueAmount: 0,
    averagePaymentDays: 25,
    lifetimeValue: 185000,
    invoiceCount: 3,
    onTimePaymentRate: 92,
  },
  invoices: [
    { id: "1", number: "INV-1045", amount: 15000, status: "pending", dueDate: "2026-02-07" },
    { id: "2", number: "INV-1032", amount: 12000, status: "paid", dueDate: "2025-12-15" },
    { id: "3", number: "INV-1018", amount: 8500, status: "paid", dueDate: "2025-11-01" },
    { id: "4", number: "INV-1005", amount: 22000, status: "paid", dueDate: "2025-09-15" },
    { id: "5", number: "INV-0991", amount: 18000, status: "paid", dueDate: "2025-08-01" },
  ],
  paymentPatterns: {
    onTime: 75,
    late1to15: 15,
    late16to30: 7,
    late30plus: 3,
  },
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getRiskBadge = (risk: "low" | "medium" | "high") => {
  switch (risk) {
    case "low":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Low Risk</Badge>;
    case "medium":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Medium Risk</Badge>;
    case "high":
      return <Badge variant="destructive">High Risk</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
    case "overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function ClientProfile({ clientId }: ClientProfileProps) {
  const client = getClient(clientId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {client.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                {getRiskBadge(client.riskScore)}
              </div>
              <p className="text-muted-foreground">Contact: {client.contactPerson}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Send Statement</Button>
          <Button>Create Invoice</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Receivables
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(client.stats.totalReceivables)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Amount
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(client.stats.overdueAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Payment Days
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.stats.averagePaymentDays} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lifetime Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(client.stats.lifetimeValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="invoices">
            <TabsList>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payments">Payment History</TabsTrigger>
            </TabsList>
            <TabsContent value="invoices" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice History</CardTitle>
                  <CardDescription>
                    All invoices for this client
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {invoice.number}
                            </Link>
                          </TableCell>
                          <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="payments" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Patterns</CardTitle>
                  <CardDescription>
                    Analysis of payment behavior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>On Time</span>
                        <span>{client.paymentPatterns.onTime}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${client.paymentPatterns.onTime}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>1-15 Days Late</span>
                        <span>{client.paymentPatterns.late1to15}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 rounded-full"
                          style={{ width: `${client.paymentPatterns.late1to15}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>16-30 Days Late</span>
                        <span>{client.paymentPatterns.late16to30}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${client.paymentPatterns.late16to30}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>30+ Days Late</span>
                        <span>{client.paymentPatterns.late30plus}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${client.paymentPatterns.late30plus}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Contact Info Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {client.email}
                  </a>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <a
                    href={`tel:${client.phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {client.phone}
                  </a>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {client.address}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">On-Time Payment Rate</p>
                  <p className="text-sm text-green-600 font-medium">
                    {client.stats.onTimePaymentRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
