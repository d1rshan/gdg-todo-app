import { currentUser } from "@/modules/auth/server/utils";
import { redirect } from "next/navigation";

const Page = async () => {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return <div>Dashboard Page</div>;
};

export default Page;
