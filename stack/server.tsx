import "server-only";

import { StackServerApp as StackServerAppCtor } from "@stackframe/stack";
import { getStackClientApp } from "./client";

type StackServerAppInstance = InstanceType<typeof StackServerAppCtor>;

let stackServerAppInstance: StackServerAppInstance | null = null;

const createStackServerApp = (): StackServerAppInstance => {
  const secretServerKey = process.env.STACK_SECRET_SERVER_KEY;
  if (!secretServerKey) {
    throw new Error("Stack server configuration manquante : définis STACK_SECRET_SERVER_KEY.");
  }
  return new StackServerAppCtor({
    inheritsFrom: getStackClientApp(),
    secretServerKey,
  });
};

export const getStackServerApp = (): StackServerAppInstance => {
  if (!stackServerAppInstance) {
    stackServerAppInstance = createStackServerApp();
  }
  return stackServerAppInstance;
};

export const stackServerApp = new Proxy({} as StackServerAppInstance, {
  get(_target, property, receiver) {
    const instance = getStackServerApp();
    const value = Reflect.get(instance as Record<PropertyKey, unknown>, property, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
