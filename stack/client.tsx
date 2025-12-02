import { StackClientApp as StackClientAppCtor, type StackClientApp } from "@stackframe/stack";

type StackClientAppInstance = StackClientApp<true, string>;

let stackClientAppInstance: StackClientAppInstance | null = null;

const createStackClientApp = (): StackClientAppInstance => {
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

  if (!projectId || !publishableClientKey) {
    throw new Error(
      "Stack client configuration manquante : définis NEXT_PUBLIC_STACK_PROJECT_ID et NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY.",
    );
  }

  return new StackClientAppCtor({
    tokenStore: "nextjs-cookie",
    projectId,
    publishableClientKey,
  }) as StackClientAppInstance;
};

export const getStackClientApp = (): StackClientAppInstance => {
  if (!stackClientAppInstance) {
    stackClientAppInstance = createStackClientApp();
  }
  return stackClientAppInstance;
};

export const stackClientApp = new Proxy({} as StackClientAppInstance, {
  get(_target, property, receiver) {
    const instance = getStackClientApp();
    const value = Reflect.get(instance as Record<PropertyKey, unknown>, property, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
