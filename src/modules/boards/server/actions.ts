"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { boards, lists, cards } from "@/db/schema";
import { currentUser } from "@/modules/auth/server/utils";
import { Board } from "@/types";

export async function getBoards(): Promise<Board[]> {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const userId = user.id;

    const data = await db
      .select({ id: boards.id, title: boards.title })
      .from(boards)
      .where(eq(boards.userId, userId));

    return data;
  } catch (error) {
    console.log("[getBoards]", error);
    throw new Error("Failed to fetch boards.");
  }
}
export async function createBoard(data: { title: string }): Promise<Board> {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const userId = user.id;

    const { title } = data;

    const [board] = await db
      .insert(boards)
      .values({
        title,
        userId,
      })
      .returning();

    return board;
  } catch (error) {
    console.log("[createBoard]", error);
    throw new Error("Failed to create board");
  }
}

export async function deleteBoard(data: { boardId: string }): Promise<Board> {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const userId = user.id;
    const { boardId } = data;

    const [board] = await db
      .delete(boards)
      .where(and(eq(boards.userId, userId), eq(boards.id, boardId)))
      .returning();

    if (!board) {
      throw new Error("Board not found or could not be deleted.");
    }

    return board;
  } catch (error) {
    console.log("[deleteBoard]", error);
    throw new Error("Failed to delete board");
  }
}

export async function renameBoard(data: { title: string; boardId: string }) {
  try {
    const user = await currentUser();

    if (!user) return { error: "Unauthorized" };

    const userId = user.id;

    const { title, boardId } = data;

    await db
      .update(boards)
      .set({ title })
      .where(and(eq(boards.userId, userId), eq(boards.id, boardId)));
  } catch (error) {
    console.log("[renameBoard]", error);
    throw new Error("Failed to rename board");
  }
}

export async function createList(formData: FormData) {
  const id = formData.get("id") as string;
  const boardId = formData.get("boardId") as string;
  const title = formData.get("title") as string;

  if (!id || !boardId || !title)
    return { error: "Client ID, Board ID, and title are required." };

  try {
    const highestOrderList = await db.query.lists.findFirst({
      where: eq(lists.boardId, boardId),
      orderBy: (lists, { desc }) => [desc(lists.order)],
      columns: { order: true },
    });

    const newOrder = highestOrderList ? highestOrderList.order + 1 : 0;

    const [newList] = await db
      .insert(lists)
      .values({ id, boardId, title, order: newOrder })
      .returning();

    revalidatePath(`/board/${boardId}`);
    return { data: newList };
  } catch (error) {
    console.log("[createlist]", error);
    return { error: "Failed to create list." };
  }
}

export async function renameList(formData: FormData) {
  const listId = formData.get("listId") as string;
  const boardId = formData.get("boardId") as string;
  const title = formData.get("title") as string;

  if (!listId || !boardId || !title)
    return { error: "Missing required fields." };

  try {
    await db.update(lists).set({ title }).where(eq(lists.id, listId));
    revalidatePath(`/board/${boardId}`);
    return { success: true };
  } catch (error) {
    console.log(error);
    return { error: "Failed to rename list." };
  }
}

export async function reorderLists(formData: FormData) {
  const boardId = formData.get("boardId") as string;
  const rawOrderedIds = formData.get("orderedIds") as string;

  const orderedIds = rawOrderedIds
    ? rawOrderedIds.split(",").filter(Boolean)
    : [];

  if (!boardId) {
    return { error: "Missing board ID." };
  }

  try {
    await db.transaction(async (tx) => {
      if (orderedIds.length > 0) {
        await Promise.all(
          orderedIds.map((id, index) =>
            tx
              .update(lists)
              .set({ order: index })
              .where(and(eq(lists.id, id), eq(lists.boardId, boardId)))
          )
        );
      }
    });

    revalidatePath(`/board/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("REORDER LISTS FAILED:", error);
    return { error: "Failed to reorder lists." };
  }
}

export async function createCard(formData: FormData) {
  const id = formData.get("id") as string;
  const listId = formData.get("listId") as string;
  const boardId = formData.get("boardId") as string;
  const title = formData.get("title") as string;

  if (!id || !listId || !boardId || !title)
    return { error: "Missing required fields." };

  try {
    const highestOrderCard = await db.query.cards.findFirst({
      where: eq(cards.listId, listId),
      orderBy: (cards, { desc }) => [desc(cards.order)],
      columns: { order: true },
    });

    const newOrder = highestOrderCard ? highestOrderCard.order + 1 : 0;

    const [newCard] = await db
      .insert(cards)
      .values({ id, listId, boardId, title, order: newOrder })
      .returning();

    revalidatePath(`/board/${boardId}`);
    return { data: newCard };
  } catch (error) {
    console.log(error);

    return { error: "Failed to create card." };
  }
}

export async function renameCard(formData: FormData) {
  const cardId = formData.get("cardId") as string;
  const boardId = formData.get("boardId") as string;
  const title = formData.get("title") as string;

  if (!cardId || !boardId || !title)
    return { error: "Missing required fields." };

  try {
    await db.update(cards).set({ title }).where(eq(cards.id, cardId));
    revalidatePath(`/board/${boardId}`);
    return { success: true };
  } catch (error) {
    console.log(error);
    return { error: "Failed to rename card." };
  }
}

export async function reorderCard(formData: FormData) {
  const boardId = formData.get("boardId") as string;
  const sourceListId = formData.get("sourceListId") as string;
  const destListId = formData.get("destListId") as string;
  const rawSourceCardIds = formData.get("sourceCardIds") as string;
  const rawDestCardIds = formData.get("destCardIds") as string;

  const sourceCardIds = rawSourceCardIds
    ? rawSourceCardIds.split(",").filter(Boolean)
    : [];
  const destCardIds = rawDestCardIds
    ? rawDestCardIds.split(",").filter(Boolean)
    : [];

  if (!boardId || !sourceListId || !destListId) {
    return { error: "Missing required fields for card reordering." };
  }

  try {
    await db.transaction(async (tx) => {
      if (sourceListId === destListId) {
        if (destCardIds.length > 0) {
          await Promise.all(
            destCardIds.map((id, index) =>
              tx
                .update(cards)
                .set({ order: index })
                .where(and(eq(cards.id, id), eq(cards.listId, destListId)))
            )
          );
        }
      } else {
        if (destCardIds.length > 0) {
          await Promise.all(
            destCardIds.map((id, index) =>
              tx
                .update(cards)
                .set({ order: index, listId: destListId })
                .where(eq(cards.id, id))
            )
          );
        }

        if (sourceCardIds.length > 0) {
          await Promise.all(
            sourceCardIds.map((id, index) =>
              tx
                .update(cards)
                .set({ order: index })
                .where(and(eq(cards.id, id), eq(cards.listId, sourceListId)))
            )
          );
        }
      }
    });

    revalidatePath(`/board/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("REORDER CARD FAILED:", error);
    return { error: "Failed to reorder card." };
  }
}
