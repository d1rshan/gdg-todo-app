"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const SignInSocial = ({
  provider,
  children,
}: {
  provider:
    | "github"
    | "apple"
    | "discord"
    | "facebook"
    | "google"
    | "microsoft"
    | "spotify"
    | "twitch"
    | "twitter"
    | "dropbox"
    | "linkedin"
    | "gitlab"
    | "tiktok"
    | "reddit"
    | "roblox"
    | "vk"
    | "kick";
  children: React.ReactNode;
}) => {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={async () => {
        await authClient.signIn.social({
          provider,
          callbackURL: "/dashboard",
        });
      }}
      type="button"
    >
      {children}
    </Button>
  );
};
