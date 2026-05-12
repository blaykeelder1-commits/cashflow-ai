"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Loader2,
  Plus,
  MessageSquare,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useClient } from "@/hooks/use-clients";
import { useCreateFollowUpAction } from "@/hooks/use-follow-up-actions";
import { useGenerateRecommendations, useUpdateRecommendation } from "@/hooks/use-recommendations";

interface ClientProfileProps {
  clientId: string;
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
    case "partial":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Partial</Badge>;
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

export function ClientProfile({ clientId }: ClientProfileProps) {
  const { data: client, isLoading, error } = useClient(clientId);
  const createFollowUp = useCreateFollowUpAction();
  const generateRecs = useGenerateRecommendations();
  const updateRec = useUpdateRecommendation();
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [actionType, setActionType] = useState<"email" | "call" | "meeting" | "escalation" | "sms">("email");

  const handleCreateFollowUp = async () => {
    if (!client) return;
    await createFollowUp.mutateAsync({
      clientId: client.id,
      actionType,
      notes: notes || undefined,
    });
    setFollowUpDialogOpen(false);
    setNotes("");
  };

  const handleGenerateRecommendations = async () => {
    if (!client) return;
    await generateRecs.mutateAsync({ clientId: client.id, limit: 5 });
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
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
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

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Client not found</h2>
        <p className="text-muted-foreground mb-4">
          The client you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Button asChild>
          <Link href="/clients">Back to Clients</Link>
        </Button>
      </div>
    );
  }

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
                {getRiskBadge(client.riskLevel)}
                {client.paymentBehaviorTier && (
                  <Badge variant="outline">Tier {client.paymentBehaviorTier}</Badge>
                )}
              </div>
              {client.industry && (
                <p className="text-muted-foreground">{client.industry}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Log Follow-up</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Follow-up Action</DialogTitle>
                <DialogDescription>
                  Record a follow-up action for {client.name}.
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
          <Button asChild>
            <Link href={`/invoices?clientId=${client.id}`}>View Invoices</Link>
          </Button>
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
            <div className={`text-2xl font-bold ${client.stats.overdueAmount > 0 ? "text-destructive" : ""}`}>
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
            <div className="text-2xl font-bold">{Math.round(client.stats.averagePaymentDays)} days</div>
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
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="payments">Payment Patterns</TabsTrigger>
              <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice History</CardTitle>
                  <CardDescription>
                    {client.stats.invoiceCount} total invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {client.invoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No invoices yet</p>
                    </div>
                  ) : (
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
                                {invoice.number || invoice.id.slice(0, 8)}
                              </Link>
                            </TableCell>
                            <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Follow-up History</CardTitle>
                    <CardDescription>Recent interactions with this client</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFollowUpDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Log Action
                  </Button>
                </CardHeader>
                <CardContent>
                  {client.followUpActions.length === 0 ? (
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
                      {client.followUpActions.map((action, index) => (
                        <div key={action.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              {getTimelineIcon(action.actionType)}
                            </div>
                            {index < client.followUpActions.length - 1 && (
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
                              {formatDate(action.actionDate)}
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

                  {(client.bestContactDay || client.bestContactHour !== null) && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <h4 className="text-sm font-medium mb-3">Best Contact Time</h4>
                        <div className="flex gap-4">
                          {client.bestContactDay && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="capitalize">{client.bestContactDay}</span>
                            </div>
                          )}
                          {client.bestContactHour !== null && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {client.bestContactHour > 12
                                  ? `${client.bestContactHour - 12}:00 PM`
                                  : `${client.bestContactHour}:00 AM`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>AI Recommendations</CardTitle>
                    <CardDescription>Smart suggestions for this client</CardDescription>
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
                  {client.recommendations.length === 0 ? (
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
                      {client.recommendations.map((rec) => (
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

        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <>
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
                </>
              )}
              {client.phone && (
                <>
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
                </>
              )}
              <div className="flex items-start gap-3">
                <TrendingUp className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Payment Score</p>
                  <p className="text-sm">
                    {client.paymentBehaviorScore !== null
                      ? `${client.paymentBehaviorScore}/100`
                      : "Not scored"}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">On-Time Payment Rate</p>
                  <p className={`text-sm font-medium ${client.stats.onTimePaymentRate >= 80 ? "text-green-600" : client.stats.onTimePaymentRate >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                    {client.stats.onTimePaymentRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setActionType("call");
                  setFollowUpDialogOpen(true);
                }}
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
                Send Email
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleGenerateRecommendations}
                disabled={generateRecs.isPending}
              >
                {generateRecs.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lightbulb className="h-4 w-4 mr-2" />
                )}
                Get AI Insights
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
