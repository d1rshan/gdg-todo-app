import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  user: { modelName: "users" },
  session: { modelName: "sessions" },
  account: { modelName: "accounts", accountLinking: { enabled: true } },
  verification: { modelName: "verifications" },
  database: drizzleAdapter(db, {
    schema,
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()], // Now, when you call functions that set cookies, they will be automatically set. (like sign in, sign up)
});
