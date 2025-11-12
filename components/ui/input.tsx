"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-11 w-full rounded-md border bg-muted/40 px-4 text-base text-foreground placeholder:text-muted-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      state: {
        default: "border-white/10",
        success: "border-success/70 focus-visible:ring-success/60",
        error: "border-error/70 focus-visible:ring-error/60",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", state, ...props }, ref) => {
    return <input type={type} className={cn(inputVariants({ state, className }))} ref={ref} {...props} />;
  },
);
Input.displayName = "Input";
