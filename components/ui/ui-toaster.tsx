"use client";

import { Toaster } from "sonner";

export const UiToaster = () => (
  <Toaster
    position="top-center"
    expand
    richColors
    toastOptions={{
      classNames: {
        toast: "bg-card text-foreground border border-white/10 shadow-lg shadow-black/40 rounded-2xl px-4 py-3",
        icon: "text-primary",
        title: "font-heading text-base",
        description: "text-sm text-muted-foreground",
        closeButton:
          "rounded-full text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
      },
      duration: 3500,
    }}
  />
);
