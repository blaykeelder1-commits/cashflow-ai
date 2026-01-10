"use client";

import Link from "next/link";
import { MoreHorizontal, Mail, Phone, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Client {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  totalReceivables: number;
  overdueAmount: number;
  invoiceCount: number;
  paymentTrend: "up" | "down" | "stable";
  riskScore: "low" | "medium" | "high";
}

const clients: Client[] = [
  {
    id: "1",
    name: "Global Solutions",
    initials: "GS",
    email: "billing@globalsolutions.com",
    phone: "+1 (555) 123-4567",
    totalReceivables: 15000,
    overdueAmount: 0,
    invoiceCount: 3,
    paymentTrend: "up",
    riskScore: "low",
  },
  {
    id: "2",
    name: "Acme Corp",
    initials: "AC",
    email: "accounts@acmecorp.com",
    phone: "+1 (555) 234-5678",
    totalReceivables: 21000,
    overdueAmount: 0,
    invoiceCount: 5,
    paymentTrend: "stable",
    riskScore: "low",
  },
  {
    id: "3",
    name: "TechStart Inc",
    initials: "TS",
    email: "finance@techstart.io",
    phone: "+1 (555) 345-6789",
    totalReceivables: 12750,
    overdueAmount: 12750,
    invoiceCount: 2,
    paymentTrend: "down",
    riskScore: "high",
  },
  {
    id: "4",
    name: "Metro Design",
    initials: "MD",
    email: "billing@metrodesign.com",
    phone: "+1 (555) 456-7890",
    totalReceivables: 8750,
    overdueAmount: 8750,
    invoiceCount: 1,
    paymentTrend: "down",
    riskScore: "high",
  },
  {
    id: "5",
    name: "Bright Ideas LLC",
    initials: "BI",
    email: "ap@brightideas.co",
    phone: "+1 (555) 567-8901",
    totalReceivables: 22000,
    overdueAmount: 0,
    invoiceCount: 4,
    paymentTrend: "up",
    riskScore: "low",
  },
  {
    id: "6",
    name: "Summit Partners",
    initials: "SP",
    email: "payments@summitpartners.com",
    phone: "+1 (555) 678-9012",
    totalReceivables: 5500,
    overdueAmount: 0,
    invoiceCount: 2,
    paymentTrend: "stable",
    riskScore: "medium",
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getRiskBadge = (risk: Client["riskScore"]) => {
  switch (risk) {
    case "low":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Low Risk</Badge>;
    case "medium":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Medium Risk</Badge>;
    case "high":
      return <Badge variant="destructive">High Risk</Badge>;
  }
};

const getTrendIcon = (trend: Client["paymentTrend"]) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case "down":
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    case "stable":
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

export function ClientList() {
  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients..." className="pl-8" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {client.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-semibold hover:underline"
                    >
                      {client.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      {getRiskBadge(client.riskScore)}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/clients/${client.id}`}>View Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Create Invoice</DropdownMenuItem>
                    <DropdownMenuItem>Send Statement</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Edit Client</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Receivables</p>
                  <div className="flex items-center gap-1">
                    <p className="font-semibold">{formatCurrency(client.totalReceivables)}</p>
                    {getTrendIcon(client.paymentTrend)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className={`font-semibold ${client.overdueAmount > 0 ? "text-red-600" : ""}`}>
                    {formatCurrency(client.overdueAmount)}
                  </p>
                </div>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                {client.invoiceCount} active invoice{client.invoiceCount !== 1 ? "s" : ""}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
