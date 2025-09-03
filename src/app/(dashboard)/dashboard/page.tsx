import { redirect } from "next/navigation";

import { currentUser } from "@/modules/auth/server/utils";
import { DashboardView } from "@/modules/dashboard/ui/views/dashboard-view";

const Page = async () => {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <DashboardView />;
};

export default Page;
