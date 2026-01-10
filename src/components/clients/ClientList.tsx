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
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/hooks/use-clients";
import { useState } from "react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getTierBadge = (tier: string | null) => {
  switch (tier) {
    case "A":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Low Risk</Badge>;
    case "B":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Good</Badge>;
    case "C":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Medium Risk</Badge>;
    case "D":
      return <Badge variant="destructive">High Risk</Badge>;
    default:
      return <Badge variant="outline">Unscored</Badge>;
  }
};

const getPaymentTrend = (avgDaysToPay: number | null) => {
  if (avgDaysToPay === null) {
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
  if (avgDaysToPay <= 30) {
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  }
  if (avgDaysToPay <= 60) {
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
  return <TrendingDown className="h-4 w-4 text-red-600" />;
};

function ClientCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientList() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useClients({ search: search || undefined, limit: 20 });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ClientCardSkeleton />
          <ClientCardSkeleton />
          <ClientCardSkeleton />
          <ClientCardSkeleton />
          <ClientCardSkeleton />
          <ClientCardSkeleton />
        </div>
      ) : error ? (
        <div className="text-center text-muted-foreground py-8">
          Failed to load clients. Please try again.
        </div>
      ) : data?.clients && data.clients.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(client.name)}
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
                        {getTierBadge(client.paymentBehaviorTier)}
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
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {!client.email && !client.phone && (
                    <div className="text-muted-foreground text-xs">No contact info</div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <div className="flex items-center gap-1">
                      <p className="font-semibold">{formatCurrency(client.totalOutstanding)}</p>
                      {getPaymentTrend(client.avgDaysToPay)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Invoiced</p>
                    <p className="font-semibold">
                      {formatCurrency(client.totalInvoiced)}
                    </p>
                  </div>
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  {client.openInvoices} open invoice{client.openInvoices !== 1 ? "s" : ""}
                  {client.avgDaysToPay !== null && ` · Avg ${Math.round(client.avgDaysToPay)} days to pay`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          No clients found. Add your first client to get started.
        </div>
      )}
    </div>
  );
}
