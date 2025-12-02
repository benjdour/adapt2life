import "server-only";

import { StackServerApp as StackServerAppCtor, type StackServerApp } from "@stackframe/stack";
import { getStackClientApp } from "./client";

type StackServerAppInstance = StackServerApp<true, string>;

let stackServerAppInstance: StackServerAppInstance | null = null;

const createStackServerApp = (): StackServerAppInstance => {
  const secretServerKey = process.env.STACK_SECRET_SERVER_KEY;
  if (!secretServerKey) {
    throw new Error("Stack server configuration manquante : définis STACK_SECRET_SERVER_KEY.");
  }
  return new StackServerAppCtor({
    inheritsFrom: getStackClientApp(),
    secretServerKey,
  }) as StackServerAppInstance;
};

export const getStackServerApp = (): StackServerAppInstance => {
  if (!stackServerAppInstance) {
    stackServerAppInstance = createStackServerApp();
  }
  return stackServerAppInstance;
};

export const stackServerApp = {
  getUser: (...args: Parameters<StackServerAppInstance["getUser"]>) => getStackServerApp().getUser(...args),
  useUser: (...args: Parameters<StackServerAppInstance["useUser"]>) => getStackServerApp().useUser(...args),
  createTeam: (...args: Parameters<StackServerAppInstance["createTeam"]>) => getStackServerApp().createTeam(...args),
  createUser: (...args: Parameters<StackServerAppInstance["createUser"]>) => getStackServerApp().createUser(...args),
  grantProduct: (...args: Parameters<StackServerAppInstance["grantProduct"]>) => getStackServerApp().grantProduct(...args),
};
