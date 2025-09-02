import "server-only";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function currentUser() {
  const currentSession = await auth.api.getSession({
    headers: await headers(),
  });

  if (!currentSession) return null;

  const user = currentSession.user;

  return user;
}
