import { StackClientApp } from "@stackframe/stack";

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

if (!projectId || !publishableClientKey) {
  throw new Error(
    "Stack client configuration manquante : définis NEXT_PUBLIC_STACK_PROJECT_ID et NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY.",
  );
}

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  projectId,
  publishableClientKey,
});
