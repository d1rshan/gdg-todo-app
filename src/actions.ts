// /app/board/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lists, cards } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { error } from "console";

// --- LIST ACTIONS ---

export async function createList(formData: FormData) {
  // 1. Now accepts the ID from the client
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

    // 2. Inserts the provided ID into the database
    const [newList] = await db
      .insert(lists)
      .values({ id, boardId, title, order: newOrder }) // <-- ID is included here
      .returning();

    revalidatePath(`/board/${boardId}`);
    return { data: newList };
  } catch (error) {
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
    return { error: "Failed to rename list." };
  }
}

export async function reorderLists(formData: FormData) {
  const boardId = formData.get("boardId") as string;
  const rawOrderedIds = formData.get("orderedIds") as string;

  // Split the string and filter out any empty values
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
// --- CARD ACTIONS ---

export async function createCard(formData: FormData) {
  // 1. Now accepts the ID from the client
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

    // 2. Inserts the provided ID into the database
    const [newCard] = await db
      .insert(cards)
      .values({ id, listId, boardId, title, order: newOrder }) // <-- ID is included here
      .returning();

    revalidatePath(`/board/${boardId}`);
    return { data: newCard };
  } catch (error) {
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
    return { error: "Failed to rename card." };
  }
}

export async function reorderCard(formData: FormData) {
  const boardId = formData.get("boardId") as string;
  const sourceListId = formData.get("sourceListId") as string;
  const destListId = formData.get("destListId") as string;
  const rawSourceCardIds = formData.get("sourceCardIds") as string;
  const rawDestCardIds = formData.get("destCardIds") as string;

  // Split strings and filter out any empty values to prevent errors
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
      // Reordering within the same list
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
      }
      // Moving card to a different list
      else {
        // Update destination list
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

        // Update source list
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
