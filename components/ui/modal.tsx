"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;

const overlayStyles =
  "fixed inset-0 bg-black/70 backdrop-blur-[var(--glass-blur,12px)] data-[state=open]:animate-fade-in-up";

export const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} className={cn(overlayStyles, className)} {...props} />
));
ModalOverlay.displayName = "ModalOverlay";

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/15 bg-card/95 p-8 shadow-2xl shadow-black/40 focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-6 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
        <span aria-hidden className="relative block h-3.5 w-3.5">
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 rotate-45 bg-current" />
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 -rotate-45 bg-current" />
        </span>
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
ModalContent.displayName = "ModalContent";

export const ModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-4 space-y-2 text-left", className)} {...props} />
);

export const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-2xl font-heading text-foreground", className)} {...props} />
));
ModalTitle.displayName = "ModalTitle";

export const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-base text-muted-foreground", className)} {...props} />
));
ModalDescription.displayName = "ModalDescription";

export const ModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end", className)} {...props} />
);

export const ModalActions = ({
  onConfirm,
  confirmLabel = "Continuer",
  cancelLabel = "Annuler",
  confirmVariant = "primary",
}: {
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: React.ComponentProps<typeof Button>["variant"];
}) => (
  <ModalFooter>
    <ModalClose asChild>
      <Button variant="ghost">{cancelLabel}</Button>
    </ModalClose>
    <Button variant={confirmVariant} onClick={onConfirm}>
      {confirmLabel}
    </Button>
  </ModalFooter>
);
