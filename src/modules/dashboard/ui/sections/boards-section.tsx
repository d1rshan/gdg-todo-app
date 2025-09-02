"use client";

import Link from "next/link";

import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card";
import { Board } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";
import { useModal } from "@/hooks/use-modal";
import { useBoards } from "@/features/boards/hooks/useBoards";

export function BoardCards() {
  const { onOpen } = useModal();

  const { data: boards = [] } = useBoards();

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {boards.map((board: Board) => (
        <div key={board.id}>
          <Link href={`/boards/${board.id}`} key={board.id}>
            <Card className="@container/card cursor-pointer group ">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {board.title}
                </CardTitle>
                <CardAction>
                  {board.role === "ADMIN" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <div className="rounded-md p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent">
                          <IconDotsVertical />
                          <span className="sr-only">More</span>
                        </div>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        className="w-24 rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            onOpen("editBoard", {
                              boardId: board.id,
                              boardTitle: board.title,
                            })
                          }
                        >
                          <IconEdit />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            onOpen("deleteBoard", {
                              boardId: board.id,
                              boardTitle: board.title,
                            })
                          }
                        >
                          <IconTrash />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardAction>
              </CardHeader>
            </Card>
          </Link>
        </div>
      ))}
    </div>
  );
}
