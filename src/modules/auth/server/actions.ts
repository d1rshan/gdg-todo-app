"use server";

import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";

interface signInProps {
  email: string;
  password: string;
}

export async function signIn({ email, password }: signInProps) {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });
    return { success: true };
  } catch (error) {
    if (error instanceof APIError) {
      switch (error.status) {
        case "UNAUTHORIZED":
          return { error: "Invalid credentials!" };
        case "BAD_REQUEST":
          return { error: "Invalid email!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    return { error: "Internal error!" };
  }
}

interface signUpProps {
  email: string;
  name: string;
  password: string;
  image?: string;
}

export async function signUp({ email, name, password, image }: signUpProps) {
  try {
    await auth.api.signUpEmail({
      body: {
        email,
        name,
        password,
        image,
      },
    });
    return { success: true };
  } catch (error) {
    if (error instanceof APIError) {
      switch (error.status) {
        case "UNPROCESSABLE_ENTITY":
          return { error: "User already exists!" };
        case "BAD_REQUEST":
          return { error: "Invalid email!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    return { error: "Internal error!" };
  }
}
