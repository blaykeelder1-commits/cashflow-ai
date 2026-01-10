"use client";

import { ArrowLeft, Download, Send, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface InvoiceDetailProps {
  invoiceId: string;
}

// Mock invoice data
const getInvoice = (id: string) => ({
  id,
  invoiceNumber: "INV-1045",
  status: "pending" as const,
  client: {
    name: "Global Solutions",
    email: "billing@globalsolutions.com",
    address: "123 Business Ave, Suite 100\nNew York, NY 10001",
    initials: "GS",
  },
  amount: 15000,
  issueDate: "2026-01-08",
  dueDate: "2026-02-07",
  items: [
    { description: "Web Development Services", quantity: 40, rate: 250, total: 10000 },
    { description: "UI/UX Design", quantity: 20, rate: 200, total: 4000 },
    { description: "Project Management", quantity: 10, rate: 100, total: 1000 },
  ],
  paymentHistory: [
    { date: "2026-01-08", event: "Invoice created", amount: null, type: "created" },
    { date: "2026-01-08", event: "Invoice sent to client", amount: null, type: "sent" },
    { date: "2026-01-15", event: "Payment reminder sent", amount: null, type: "reminder" },
  ],
  notes: "Payment terms: Net 30. Please include invoice number in payment reference.",
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
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusBadge = (status: "paid" | "pending" | "overdue" | "draft") => {
  switch (status) {
    case "paid":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
    case "overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    case "draft":
      return <Badge variant="outline">Draft</Badge>;
  }
};

const getTimelineIcon = (type: string) => {
  switch (type) {
    case "created":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "sent":
      return <Send className="h-4 w-4 text-blue-600" />;
    case "reminder":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "payment":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const invoice = getInvoice(invoiceId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
            {getStatusBadge(invoice.status)}
          </div>
          <p className="text-muted-foreground">
            Created on {formatDate(invoice.issueDate)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Send Reminder
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Bill To</h4>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {invoice.client.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{invoice.client.name}</p>
                      <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                        {invoice.client.address}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Issue Date</h4>
                    <p>{formatDate(invoice.issueDate)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
                    <p>{formatDate(invoice.dueDate)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Line Items */}
              <div>
                <h4 className="text-sm font-medium mb-3">Line Items</h4>
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 text-sm font-medium">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Rate</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  {invoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 p-3 border-t text-sm">
                      <div className="col-span-6">{item.description}</div>
                      <div className="col-span-2 text-right">{item.quantity}</div>
                      <div className="col-span-2 text-right">{formatCurrency(item.rate)}</div>
                      <div className="col-span-2 text-right font-medium">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-12 gap-4 p-3 border-t bg-muted/50">
                    <div className="col-span-10 text-right font-medium">Total</div>
                    <div className="col-span-2 text-right font-bold text-lg">
                      {formatCurrency(invoice.amount)}
                    </div>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                    <p className="text-sm">{invoice.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment History Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Timeline of invoice activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.paymentHistory.map((event, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {getTimelineIcon(event.type)}
                      </div>
                      {index < invoice.paymentHistory.length - 1 && (
                        <div className="h-full w-px bg-border mt-2" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{event.event}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.date)}
                      </p>
                      {event.amount && (
                        <p className="text-sm font-medium text-green-600 mt-1">
                          {formatCurrency(event.amount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
