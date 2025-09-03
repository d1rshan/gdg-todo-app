import { db } from "@/db";
import KanbanBoard from "@/modules/boards/ui/views/kanban-board-view";
import { List } from "@/types";
import { notFound } from "next/navigation";

async function getBoardData(boardId: string): Promise<List[] | null> {
  // Drizzle query to get lists and their cards, all sorted by their order
  const boardLists = await db.query.lists.findMany({
    where: (lists, { eq }) => eq(lists.boardId, boardId),
    orderBy: (lists, { asc }) => [asc(lists.order)],
    with: {
      cards: {
        orderBy: (cards, { asc }) => [asc(cards.order)],
      },
    },
  });

  if (!boardLists) return null;

  return boardLists;
}

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const p = await params;
  const initialData = await getBoardData(p.boardId);

  if (!initialData) {
    notFound();
  }

  return (
    <main className="px-4">
      <KanbanBoard initialData={initialData} boardId={p.boardId} />
    </main>
  );
}
