import * as React from "react";

import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { requiredIndicator?: boolean }
>(({ className, requiredIndicator, children, ...props }, ref) => (
  <label ref={ref} className={cn("text-sm font-semibold text-foreground", className)} {...props}>
    {children}
    {requiredIndicator ? <span className="ml-1 text-xs text-secondary">*</span> : null}
  </label>
));
Label.displayName = "Label";

export { Label };
