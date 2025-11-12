import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-primary text-white shadow-lg shadow-primary/40 hover:shadow-2xl hover:brightness-110 border border-white/10",
        secondary:
          "border border-primary/40 text-primary bg-transparent hover:bg-primary/10 focus-visible:ring-secondary",
        ghost: "text-muted-foreground hover:bg-muted/60",
        outline: "border border-white/15 bg-card/30 text-foreground hover:bg-card/60",
        error: "bg-error text-white hover:bg-[#d94c46]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-md px-4",
        lg: "h-12 rounded-lg px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

const LoadingSpinner = () => (
  <span className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const content = (
      <>
        {isLoading ? <LoadingSpinner /> : null}
        <span className="flex items-center gap-2">{children}</span>
      </>
    );

    const sharedProps = {
      className: cn(buttonVariants({ variant, size, className }), isLoading && "cursor-progress"),
      ref,
      "aria-busy": isLoading,
      "aria-live": "polite" as const,
    };

    if (asChild) {
      return (
        <Comp {...sharedProps} {...props}>
          {content}
        </Comp>
      );
    }

    return (
      <Comp {...sharedProps} disabled={disabled || isLoading} {...props}>
        {content}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
