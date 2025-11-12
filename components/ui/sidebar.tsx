"use client";

import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

export type SidebarItem = {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  active?: boolean;
};

export type SidebarProps = {
  items: SidebarItem[];
  collapsed?: boolean;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
};

export const Sidebar = ({ items, collapsed = false, footer, header, className }: SidebarProps) => {
  return (
    <aside
      className={cn(
        "glass-panel flex h-full flex-col border border-white/10",
        collapsed ? "w-24" : "w-72",
        className,
      )}
    >
      <div className="px-4 py-6">
        {header ? header : <span className="text-lg font-heading text-primary">Adapt2Life</span>}
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                item.active ? "bg-gradient-primary text-white shadow-lg shadow-primary/30" : null,
                collapsed ? "justify-center" : null,
              )}
            >
              {Icon ? <Icon className="h-5 w-5 flex-shrink-0" /> : null}
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && item.badge ? (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">{item.badge}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      {footer ? <div className="border-t border-white/10 px-4 py-4">{footer}</div> : null}
    </aside>
  );
};
