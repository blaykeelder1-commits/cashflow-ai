"use client";

import { AlertTriangle, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AlertBannerProps {
  type?: "warning" | "error" | "info";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  dismissible?: boolean;
}

export function AlertBanner({
  type = "warning",
  title,
  description,
  actionLabel,
  actionHref,
  dismissible = true,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const bgColor = {
    warning: "bg-yellow-50 border-yellow-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
  }[type];

  const iconColor = {
    warning: "text-yellow-600",
    error: "text-red-600",
    info: "text-blue-600",
  }[type];

  const textColor = {
    warning: "text-yellow-800",
    error: "text-red-800",
    info: "text-blue-800",
  }[type];

  return (
    <div className={`rounded-lg border p-4 ${bgColor}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-5 w-5 mt-0.5 ${iconColor}`} />
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${textColor}`}>{title}</h4>
          <p className={`text-sm mt-1 ${textColor} opacity-80`}>{description}</p>
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className={`inline-flex items-center gap-1 text-sm font-medium mt-2 ${textColor} hover:underline`}
            >
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-1"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
