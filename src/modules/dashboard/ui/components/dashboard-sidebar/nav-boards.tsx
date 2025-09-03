"use client";

import Link from "next/link";
import { IconLayout } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useBoards } from "@/modules/boards/hooks/useBoards";
import { Board } from "@/types";
import { usePathname } from "next/navigation";

export const NavBoards = () => {
  const { data } = useBoards();
  const pathname = usePathname();

  const boards = (data as Board[]) ?? [];

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Boards</SidebarGroupLabel>
      <SidebarMenu>
        {boards.slice(0, 7).map((board) => {
          const isActive = pathname === `/boards/${board.id}`;
          return (
            <SidebarMenuItem key={board.id}>
              <SidebarMenuButton
                asChild
                className={cn(
                  isActive &&
                    "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                )}
              >
                <Link href={`/boards/${board.id}`}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <IconLayout />
                      <span>{board.title}</span>
                    </div>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
};
