"use client";

import { IconLayout } from "@tabler/icons-react";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Board } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useBoards } from "@/features/boards/hooks/useBoards";

export function NavBoards() {
  const pathname = usePathname();

  const { data: boards } = useBoards();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Boards</SidebarGroupLabel>
      <SidebarMenu>
        {boards.slice(0, 7).map((board: Board) => {
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
}
