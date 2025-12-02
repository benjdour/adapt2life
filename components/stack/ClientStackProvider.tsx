"use client";

import { StackProvider } from "@stackframe/stack";
import type { StackClientApp } from "@stackframe/stack";

type ClientStackProviderProps = {
  app: StackClientApp<true, string>;
  children: React.ReactNode;
};

export function ClientStackProvider({ app, children }: ClientStackProviderProps) {
  return <StackProvider app={app}>{children}</StackProvider>;
}
