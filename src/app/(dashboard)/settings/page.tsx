"use client";

import { useState } from "react";
import {
  User,
  Bell,
  Link2,
  CreditCard,
  Building2,
  Check,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const integrations = [
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    description: "Sync invoices and payments automatically",
    icon: "QB",
    connected: true,
    lastSync: "2 hours ago",
  },
  {
    id: "xero",
    name: "Xero",
    description: "Connect your Xero accounting software",
    icon: "XE",
    connected: false,
    lastSync: null,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept online payments from clients",
    icon: "ST",
    connected: true,
    lastSync: "1 hour ago",
  },
  {
    id: "plaid",
    name: "Plaid",
    description: "Connect bank accounts for real-time cash position",
    icon: "PL",
    connected: false,
    lastSync: null,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get notifications in your Slack workspace",
    icon: "SL",
    connected: true,
    lastSync: "Active",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Send invoices and reminders via Gmail",
    icon: "GM",
    connected: false,
    lastSync: null,
  },
];

const notificationSettings = [
  { id: "overdue", label: "Overdue invoice alerts", enabled: true },
  { id: "payment", label: "Payment received notifications", enabled: true },
  { id: "reminder", label: "Payment due reminders", enabled: true },
  { id: "weekly", label: "Weekly cash flow summary", enabled: false },
  { id: "risk", label: "Client risk alerts", enabled: true },
];

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(notificationSettings);

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, integrations, and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Link2 className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">JD</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">Change Avatar</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <Input defaultValue="John" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input defaultValue="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" defaultValue="john@company.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input type="tel" defaultValue="+1 (555) 123-4567" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Your business details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <Button variant="outline">Upload Logo</Button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input defaultValue="My Company Inc." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Address</label>
                  <Input defaultValue="123 Business St, Suite 100" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <Input defaultValue="New York" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">State</label>
                    <Input defaultValue="NY" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ZIP</label>
                    <Input defaultValue="10001" />
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Connected Apps</CardTitle>
              <CardDescription>
                Connect your favorite tools to sync data automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted font-semibold">
                        {integration.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{integration.name}</p>
                          {integration.connected && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <Check className="mr-1 h-3 w-3" />
                              Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {integration.description}
                        </p>
                        {integration.lastSync && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last sync: {integration.lastSync}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={integration.connected ? "outline" : "default"}
                      size="sm"
                    >
                      {integration.connected ? (
                        "Manage"
                      ) : (
                        <>
                          Connect
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((setting, index) => (
                  <div key={setting.id}>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">{setting.label}</p>
                      </div>
                      <Button
                        variant={setting.enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleNotification(setting.id)}
                      >
                        {setting.enabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                    {index < notifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Email Preferences</CardTitle>
              <CardDescription>
                Configure how you receive email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Notification Email</label>
                <Input type="email" defaultValue="john@company.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Daily Digest Time</label>
                <Input type="time" defaultValue="09:00" />
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>You are on the Pro plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-2xl font-bold">$49/month</p>
                    <p className="text-sm text-muted-foreground">Pro Plan</p>
                  </div>
                  <Badge>Current Plan</Badge>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Unlimited invoices
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Up to 100 clients
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    AI-powered insights
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Priority support
                  </li>
                </ul>
                <div className="flex gap-2">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline">Cancel Subscription</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Manage your payment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-14 items-center justify-center rounded bg-muted">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">**** **** **** 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                    </div>
                  </div>
                  <Badge variant="outline">Default</Badge>
                </div>
                <Button variant="outline" className="w-full">
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>View your past invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: "Jan 1, 2026", amount: "$49.00", status: "Paid" },
                    { date: "Dec 1, 2025", amount: "$49.00", status: "Paid" },
                    { date: "Nov 1, 2025", amount: "$49.00", status: "Paid" },
                  ].map((invoice, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{invoice.date}</p>
                        <p className="text-sm text-muted-foreground">Pro Plan - Monthly</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium">{invoice.amount}</p>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          {invoice.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
