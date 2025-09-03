import { redirect } from "next/navigation";

import { currentUser } from "@/modules/auth/server/utils";
import { DashboardView } from "@/modules/dashboard/ui/views/dashboard-view";
import { db } from "@/db";
import { boards } from "@/db/schema";
import { eq } from "drizzle-orm";

const Page = async () => {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const data = await db.select().from(boards).where(eq(boards.userId, user.id));

  return <DashboardView />;
};

export default Page;
