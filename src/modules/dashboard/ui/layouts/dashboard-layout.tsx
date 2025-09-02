import { redirect } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { currentUser } from "@/modules/auth/server/utils";
import { ModalProvider } from "@/components/providers/modal-provider";

import { DashboardSidebar } from "../components/dashboard-sidebar";
import { DashboardSiteHeader } from "../components/dashboard-site-header";

export const DashboardLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <ModalProvider />
      <DashboardSidebar
        variant="inset"
        user={{ email: user.email, name: user.name, avatar: user.image! }}
      />
      <SidebarInset>
        <DashboardSiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
