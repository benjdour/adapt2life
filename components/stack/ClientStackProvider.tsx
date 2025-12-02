"use client";

import { StackProvider } from "@stackframe/stack";
import { getStackClientApp } from "@/stack/client";

type ClientStackProviderProps = {
  children: React.ReactNode;
};

export function ClientStackProvider({ children }: ClientStackProviderProps) {
  const app = getStackClientApp();
  return <StackProvider app={app}>{children}</StackProvider>;
}
