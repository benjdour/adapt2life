import "server-only";

import { StackServerApp } from "@stackframe/stack";
import { stackClientApp } from "./client";

const secretServerKey = process.env.STACK_SECRET_SERVER_KEY;

if (!secretServerKey) {
  throw new Error("Stack server configuration manquante : définis STACK_SECRET_SERVER_KEY.");
}

export const stackServerApp = new StackServerApp({
  inheritsFrom: stackClientApp,
  secretServerKey,
});
