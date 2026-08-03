"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/60 shadow-sm">
      {/* Decorative Background */}
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-emerald-200/30 blur-2xl" />

      <div className="relative px-6 py-8 md:px-8 md:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left */}

          <div className="space-y-3">
            {/* Breadcrumb */}

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href={'/admin'}>Dashboard</Link>

              <ChevronRight size={14} />

              <span className="font-medium text-emerald-700">{title}</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              {title}
            </h1>

            {description && (
              <p className="max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
                {description}
              </p>
            )}
          </div>

          {/* Right */}

          {actions && (
            <div className="flex flex-wrap items-center gap-3">{actions}</div>
          )}
        </div>
      </div>
    </header>
  );
}
