"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Download,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  Lightbulb,
  Loader2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useInvoice } from "@/hooks/use-invoices";
import { useCreateFollowUpAction } from "@/hooks/use-follow-up-actions";
import { useGenerateRecommendations, useUpdateRecommendation } from "@/hooks/use-recommendations";

interface InvoiceDetailProps {
  invoiceId: string;
}

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

const formatShortDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

type InvoiceStatus = "paid" | "pending" | "overdue" | "partial" | "draft" | "written_off";

const getStatusBadge = (status: string) => {
  switch (status as InvoiceStatus) {
    case "paid":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
    case "overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    case "partial":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Partial</Badge>;
    case "draft":
      return <Badge variant="outline">Draft</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getTimelineIcon = (type: string) => {
  switch (type) {
    case "email":
      return <Mail className="h-4 w-4 text-blue-600" />;
    case "call":
      return <Phone className="h-4 w-4 text-green-600" />;
    case "meeting":
      return <MessageSquare className="h-4 w-4 text-purple-600" />;
    case "escalation":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case "payment":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getOutcomeBadge = (outcome: string | null) => {
  if (!outcome) return null;
  switch (outcome) {
    case "paid":
      return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
    case "promised_payment":
      return <Badge className="bg-blue-100 text-blue-700">Promised</Badge>;
    case "partial_payment":
      return <Badge className="bg-yellow-100 text-yellow-700">Partial</Badge>;
    case "dispute":
      return <Badge variant="destructive">Dispute</Badge>;
    case "no_response":
      return <Badge variant="outline">No Response</Badge>;
    case "escalated":
      return <Badge className="bg-orange-100 text-orange-700">Escalated</Badge>;
    default:
      return <Badge variant="outline">{outcome}</Badge>;
  }
};

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const { data: invoice, isLoading, error } = useInvoice(invoiceId);
  const createFollowUp = useCreateFollowUpAction();
  const generateRecs = useGenerateRecommendations();
  const updateRec = useUpdateRecommendation();
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [actionType, setActionType] = useState<"email" | "call" | "meeting" | "escalation" | "sms">("email");

  const handleCreateFollowUp = async () => {
    if (!invoice) return;
    await createFollowUp.mutateAsync({
      invoiceId: invoice.id,
      clientId: invoice.client?.id,
      actionType,
      notes: notes || undefined,
    });
    setFollowUpDialogOpen(false);
    setNotes("");
  };

  const handleGenerateRecommendations = async () => {
    if (!invoice) return;
    await generateRecs.mutateAsync({ invoiceId: invoice.id, limit: 3 });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Invoice not found</h2>
        <p className="text-muted-foreground mb-4">The invoice you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
        <Button asChild>
          <Link href="/invoices">Back to Invoices</Link>
        </Button>
      </div>
    );
  }

  const clientInitials = invoice.client?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

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
            <h1 className="text-3xl font-bold tracking-tight">
              {invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 8)}`}
            </h1>
            {getStatusBadge(invoice.status)}
            {invoice.daysOverdue > 0 && (
              <Badge variant="destructive">{invoice.daysOverdue} days overdue</Badge>
            )}
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
          <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Log Follow-up
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Follow-up Action</DialogTitle>
                <DialogDescription>
                  Record a follow-up action for this invoice.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2 flex-wrap">
                  {(["email", "call", "meeting", "sms", "escalation"] as const).map((type) => (
                    <Button
                      key={type}
                      variant={actionType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActionType(type)}
                    >
                      {type === "email" && <Mail className="h-4 w-4 mr-1" />}
                      {type === "call" && <Phone className="h-4 w-4 mr-1" />}
                      {type === "meeting" && <MessageSquare className="h-4 w-4 mr-1" />}
                      {type === "sms" && <MessageSquare className="h-4 w-4 mr-1" />}
                      {type === "escalation" && <AlertCircle className="h-4 w-4 mr-1" />}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button
                  className="w-full"
                  onClick={handleCreateFollowUp}
                  disabled={createFollowUp.isPending}
                >
                  {createFollowUp.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Log Action
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                  {invoice.client ? (
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {clientInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          href={`/clients/${invoice.client.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {invoice.client.name}
                        </Link>
                        {invoice.client.email && (
                          <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
                        )}
                        {invoice.client.paymentBehaviorTier && (
                          <Badge variant="outline" className="mt-1">
                            Tier {invoice.client.paymentBehaviorTier}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No client assigned</p>
                  )}
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

              {/* Amount Summary */}
              <div className="rounded-md border">
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-bold">{formatCurrency(invoice.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(invoice.amountPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance Due</p>
                    <p className="text-xl font-bold text-destructive">
                      {formatCurrency(invoice.amountDue)}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Predictions */}
              {(invoice.recoveryScore || invoice.predictedPaymentDate) && (
                <>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {invoice.recoveryScore && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Recovery Score</h4>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                invoice.recoveryScore >= 70
                                  ? "bg-green-500"
                                  : invoice.recoveryScore >= 40
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${invoice.recoveryScore}%` }}
                            />
                          </div>
                          <span className="font-medium">{invoice.recoveryScore}%</span>
                        </div>
                      </div>
                    )}
                    {invoice.predictedPaymentDate && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Predicted Payment Date
                        </h4>
                        <p>{formatDate(invoice.predictedPaymentDate)}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tabs for History and Recommendations */}
          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Follow-up History</CardTitle>
                  <CardDescription>Timeline of all follow-up actions</CardDescription>
                </CardHeader>
                <CardContent>
                  {invoice.followUpActions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No follow-up actions yet</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setFollowUpDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Log First Follow-up
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {invoice.followUpActions.map((action, index) => (
                        <div key={action.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              {getTimelineIcon(action.actionType)}
                            </div>
                            {index < invoice.followUpActions.length - 1 && (
                              <div className="h-full w-px bg-border mt-2" />
                            )}
                          </div>
                          <div className="pb-4 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium capitalize">{action.actionType}</p>
                              {getOutcomeBadge(action.outcome)}
                              {action.ledToPayment && (
                                <Badge className="bg-green-100 text-green-700">Led to Payment</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatShortDate(action.actionDate)}
                              {action.createdBy?.fullName && ` by ${action.createdBy.fullName}`}
                            </p>
                            {action.notes && (
                              <p className="text-sm mt-1 text-muted-foreground">{action.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>All payments received for this invoice</CardDescription>
                </CardHeader>
                <CardContent>
                  {invoice.payments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No payments received yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invoice.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 rounded-md border"
                        >
                          <div>
                            <p className="font-medium text-green-600">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatShortDate(payment.date)}
                              {payment.method && ` via ${payment.method}`}
                            </p>
                          </div>
                          {payment.daysFromDue !== null && (
                            <Badge
                              variant="outline"
                              className={
                                payment.daysFromDue <= 0
                                  ? "border-green-500 text-green-600"
                                  : "border-yellow-500 text-yellow-600"
                              }
                            >
                              {payment.daysFromDue <= 0
                                ? `${Math.abs(payment.daysFromDue)} days early`
                                : `${payment.daysFromDue} days late`}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>AI Recommendations</CardTitle>
                    <CardDescription>Smart suggestions to improve collection</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateRecommendations}
                    disabled={generateRecs.isPending}
                  >
                    {generateRecs.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Lightbulb className="h-4 w-4 mr-2" />
                    )}
                    Generate New
                  </Button>
                </CardHeader>
                <CardContent>
                  {invoice.recommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recommendations yet</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={handleGenerateRecommendations}
                        disabled={generateRecs.isPending}
                      >
                        Generate Recommendations
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {invoice.recommendations.map((rec) => (
                        <div key={rec.id} className="p-4 rounded-md border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Badge variant="outline" className="mb-2 capitalize">
                                {rec.type.replace("_", " ")}
                              </Badge>
                              <p className="font-medium">{rec.text}</p>
                              {rec.reasoning && (
                                <p className="text-sm text-muted-foreground mt-1">{rec.reasoning}</p>
                              )}
                              {rec.confidence && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Confidence: {Math.round(rec.confidence * 100)}%
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateRec.mutate({ id: rec.id, status: "dismissed" })
                                }
                              >
                                Dismiss
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateRec.mutate({ id: rec.id, status: "accepted" })
                                }
                              >
                                Accept
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={invoice.client ? `/clients/${invoice.client.id}` : "#"}>
                  View Client Profile
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setFollowUpDialogOpen(true)}
              >
                <Phone className="h-4 w-4 mr-2" />
                Log Phone Call
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setActionType("email");
                  setFollowUpDialogOpen(true);
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email Reminder
              </Button>
            </CardContent>
          </Card>

          {/* Client Info */}
          {invoice.client && (
            <Card>
              <CardHeader>
                <CardTitle>Client Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Score</p>
                  <p className="font-medium">
                    {invoice.client.paymentBehaviorScore ?? "Not scored"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Days to Pay</p>
                  <p className="font-medium">
                    {invoice.client.avgDaysToPay
                      ? `${invoice.client.avgDaysToPay} days`
                      : "No data"}
                  </p>
                </div>
                {invoice.client.email && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${invoice.client.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {invoice.client.email}
                      </a>
                    </div>
                  </>
                )}
                {invoice.client.phone && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a
                        href={`tel:${invoice.client.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {invoice.client.phone}
                      </a>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
