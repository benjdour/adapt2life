import { cookies } from "next/headers";

export const hasStackSessionCookie = () => {
  const store = cookies();
  if (store.has("stack-access")) {
    return true;
  }

  return store
    .getAll()
    .some((cookie) => cookie.name === "stack-refresh" || cookie.name.startsWith("stack-refresh-"));
};
