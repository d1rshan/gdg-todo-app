import { db } from "@/db";
import KanbanBoard, { List } from "@/modules/boards/ui/views/board-view";
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
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Board</h1>
      <KanbanBoard initialData={initialData} boardId={p.boardId} />
    </main>
  );
}
