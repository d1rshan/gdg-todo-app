"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { boards } from "@/db/schema";
import { currentUser } from "@/modules/auth/server/utils";

export async function createBoardAction(data: { title: string }) {
  try {
    const user = await currentUser();

    if (!user) return { error: "Unauthorized" };

    const userId = user.id;

    const { title } = data;

    const [board] = await db
      .insert(boards)
      .values({
        title,
        userId,
      })
      .returning();

    return { data: board };
  } catch (error) {
    console.log("[createBoard]", error);
    return {
      error: "createBoard failed!",
    };
  }
  revalidatePath("/dashboard"); // TODO: find out will this rollback on failure
}

export async function deleteBoardAction(data: { boardId: string }) {
  try {
    const user = await currentUser();

    if (!user) return { error: "Unauthorized" };

    const userId = user.id;

    const { boardId } = data;

    await db
      .delete(boards)
      .where(and(eq(boards.userId, userId), eq(boards.id, boardId)));
  } catch (error) {
    console.log("[createBoard]", error);
    return {
      error: "createBoard failed!",
    };
  }
  //   revalidatePath("/dashboard"); // TODO: do we need this
}

export async function renameBoardAction(data: {
  title: string;
  boardId: string;
}) {
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
    return {
      error: "renameBoard failed!",
    };
  }
  //   revalidatePath("/dashboard"); // TODO: do we need this
}
