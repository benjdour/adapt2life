"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type Breakpoint = "sm" | "md" | "lg" | "xl";

export type DashboardGridProps = {
  children: React.ReactNode;
  columns?: Partial<Record<Breakpoint, 1 | 2 | 3 | 4>>;
  gap?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const gapMap: Record<NonNullable<DashboardGridProps["gap"]>, string> = {
  xs: "gap-4",
  sm: "gap-6",
  md: "gap-8",
  lg: "gap-10",
};

const breakpointClassMap: Record<Breakpoint, Record<1 | 2 | 3 | 4, string>> = {
  sm: {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
  },
  md: {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  },
  lg: {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  },
  xl: {
    1: "xl:grid-cols-1",
    2: "xl:grid-cols-2",
    3: "xl:grid-cols-3",
    4: "xl:grid-cols-4",
  },
};

export const DashboardGrid = ({ children, gap = "sm", columns, className }: DashboardGridProps) => {
  const responsiveColumns = columns ?? { sm: 1, md: 2, lg: 3, xl: 4 };
  const columnClasses = Object.entries(responsiveColumns).map(([bp, value]) => {
    const breakpoint = bp as Breakpoint;
    const count = (value ?? 1) as 1 | 2 | 3 | 4;
    return breakpointClassMap[breakpoint][count];
  });

  return (
    <div className={cn("grid grid-cols-1", gapMap[gap], columnClasses.join(" "), className)}>
      {children}
    </div>
  );
};
