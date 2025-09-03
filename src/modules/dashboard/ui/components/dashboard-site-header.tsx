"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useBoards } from "@/modules/boards/hooks/useBoards";
import { usePathname } from "next/navigation";

export const DashboardSiteHeader = () => {
  const pathname = usePathname();

  const { data: boards = [] } = useBoards();
  let title = "Dashboard";
  for (const board of boards) {
    if (pathname === `/boards/${board.id}`) {
      title = board.title;
      break;
    }
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  );
};
