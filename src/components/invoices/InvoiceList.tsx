"use client";

import Link from "next/link";
import { ArrowUpDown, MoreHorizontal, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export interface Invoice {
  id: string;
  invoiceNumber: string;
  client: {
    name: string;
    initials: string;
  };
  amount: number;
  status: "paid" | "pending" | "overdue" | "draft";
  issueDate: string;
  dueDate: string;
}

// Mock data
const invoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-1045",
    client: { name: "Global Solutions", initials: "GS" },
    amount: 15000,
    status: "pending",
    issueDate: "2026-01-08",
    dueDate: "2026-02-07",
  },
  {
    id: "2",
    invoiceNumber: "INV-1044",
    client: { name: "Acme Corp", initials: "AC" },
    amount: 8500,
    status: "paid",
    issueDate: "2026-01-05",
    dueDate: "2026-02-04",
  },
  {
    id: "3",
    invoiceNumber: "INV-1043",
    client: { name: "TechStart Inc", initials: "TS" },
    amount: 12750,
    status: "overdue",
    issueDate: "2025-12-01",
    dueDate: "2025-12-31",
  },
  {
    id: "4",
    invoiceNumber: "INV-1042",
    client: { name: "Metro Design", initials: "MD" },
    amount: 8750,
    status: "overdue",
    issueDate: "2025-11-15",
    dueDate: "2025-12-15",
  },
  {
    id: "5",
    invoiceNumber: "INV-1041",
    client: { name: "Bright Ideas LLC", initials: "BI" },
    amount: 22000,
    status: "pending",
    issueDate: "2026-01-02",
    dueDate: "2026-02-01",
  },
  {
    id: "6",
    invoiceNumber: "INV-1040",
    client: { name: "Summit Partners", initials: "SP" },
    amount: 5500,
    status: "paid",
    issueDate: "2025-12-20",
    dueDate: "2026-01-19",
  },
  {
    id: "7",
    invoiceNumber: "INV-1039",
    client: { name: "Acme Corp", initials: "AC" },
    amount: 12500,
    status: "paid",
    issueDate: "2025-12-15",
    dueDate: "2026-01-14",
  },
  {
    id: "8",
    invoiceNumber: "INV-1038",
    client: { name: "Innovation Labs", initials: "IL" },
    amount: 18000,
    status: "draft",
    issueDate: "2026-01-10",
    dueDate: "2026-02-09",
  },
];

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

const getStatusBadge = (status: Invoice["status"]) => {
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

export function InvoiceList() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">
              <Button variant="ghost" className="h-8 p-0 hover:bg-transparent">
                Invoice
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Client</TableHead>
            <TableHead>
              <Button variant="ghost" className="h-8 p-0 hover:bg-transparent">
                Amount
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <Button variant="ghost" className="h-8 p-0 hover:bg-transparent">
                Issue Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" className="h-8 p-0 hover:bg-transparent">
                Due Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="hover:underline text-primary"
                >
                  {invoice.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {invoice.client.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span>{invoice.client.name}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(invoice.amount)}
              </TableCell>
              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
              <TableCell>{formatDate(invoice.issueDate)}</TableCell>
              <TableCell>{formatDate(invoice.dueDate)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/invoices/${invoice.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                    <DropdownMenuItem>Download PDF</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Delete Invoice
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
