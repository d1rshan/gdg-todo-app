/* eslint-disable */

"use client";

import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { BoardData, List } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { SyncIndicator } from "../components/sync-indicator";
import { ListHeader } from "../components/list-header";
import { ListCards } from "../components/list-cards";
import { getDraggableStyle } from "../utils";
import {
  createCard,
  createList,
  reorderCard,
  renameCard,
  renameList,
  reorderLists,
} from "../../server/actions";

const transformInitialData = (initialLists: List[]): BoardData => {
  const lists: BoardData["lists"] = {};
  const cards: BoardData["cards"] = {};
  const listOrder = initialLists.map((list) => list.id);

  initialLists.forEach((list) => {
    lists[list.id] = { id: list.id, title: list.title, cardIds: [] };
    list.cards
      .sort((a, b) => a.order - b.order)
      .forEach((card) => {
        cards[card.id] = { id: card.id, title: card.title };
        lists[list.id].cardIds.push(card.id);
      });
  });

  return { lists, cards, listOrder };
};

export default function KanbanBoardView({
  initialData: initialLists,
  boardId,
}: {
  initialData: List[];
  boardId: string;
}) {
  const [data, setData] = useState<BoardData>(() =>
    transformInitialData(initialLists)
  );

  useEffect(() => {
    setData(transformInitialData(initialLists));
  }, [initialLists]);

  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const listInputRef = useRef<HTMLInputElement | null>(null);

  const [pendingActions, setPendingActions] = useState(0);

  const lists = useMemo(
    () => data.listOrder.map((id) => data.lists[id]),
    [data]
  );

  const handleAddList = async (title: string) => {
    if (!title.trim()) return;
    const newId = uuidv4();

    setData((prev) => ({
      ...prev,
      lists: {
        ...prev.lists,
        [newId]: { id: newId, title: title.trim(), cardIds: [] },
      },
      listOrder: [...prev.listOrder, newId],
    }));

    setNewListTitle("");
    requestAnimationFrame(() => listInputRef.current?.focus());

    const formData = new FormData();
    formData.append("id", newId);
    formData.append("boardId", boardId);
    formData.append("title", title.trim());

    setPendingActions((prev) => prev + 1);
    try {
      const result = await createList(formData);
      if (result?.error) {
        toast.error(result.error);
        setData((prev) => {
          const { [newId]: _, ...newLists } = prev.lists;
          return {
            ...prev,
            lists: newLists,
            listOrder: prev.listOrder.filter((id) => id !== newId),
          };
        });
      }
    } catch (error) {
      console.error("Failed to execute createList:", error);
      toast.error("An unexpected error occurred.");
      setData((prev) => {
        const { [newId]: _, ...newLists } = prev.lists;
        return {
          ...prev,
          lists: newLists,
          listOrder: prev.listOrder.filter((id) => id !== newId),
        };
      });
    } finally {
      setPendingActions((prev) => prev - 1);
    }
  };

  const handleAddCard = async (listId: string, title: string) => {
    if (!title.trim()) return;
    const newId = uuidv4();

    setData((prev) => ({
      ...prev,
      cards: { ...prev.cards, [newId]: { id: newId, title: title.trim() } },
      lists: {
        ...prev.lists,
        [listId]: {
          ...prev.lists[listId],
          cardIds: [...prev.lists[listId].cardIds, newId],
        },
      },
    }));

    const formData = new FormData();
    formData.append("id", newId);
    formData.append("listId", listId);
    formData.append("boardId", boardId);
    formData.append("title", title.trim());

    setPendingActions((prev) => prev + 1);
    try {
      const result = await createCard(formData);
      if (result?.error) {
        toast.error(result.error);
        setData((prev) => {
          const { [newId]: _, ...newCards } = prev.cards;
          return {
            ...prev,
            cards: newCards,
            lists: {
              ...prev.lists,
              [listId]: {
                ...prev.lists[listId],
                cardIds: prev.lists[listId].cardIds.filter(
                  (id) => id !== newId
                ),
              },
            },
          };
        });
      }
    } catch (error) {
      console.error("Failed to execute createCard:", error);
      toast.error("An unexpected error occurred.");
      setData((prev) => {
        const { [newId]: _, ...newCards } = prev.cards;
        return {
          ...prev,
          cards: newCards,
          lists: {
            ...prev.lists,
            [listId]: {
              ...prev.lists[listId],
              cardIds: prev.lists[listId].cardIds.filter((id) => id !== newId),
            },
          },
        };
      });
    } finally {
      setPendingActions((prev) => prev - 1);
    }
  };

  const handleRenameList = async (listId: string, newTitle: string) => {
    const oldTitle = data.lists[listId].title;
    if (oldTitle === newTitle.trim() || !newTitle.trim()) return;

    setData((prev) => ({
      ...prev,
      lists: {
        ...prev.lists,
        [listId]: { ...prev.lists[listId], title: newTitle },
      },
    }));

    const formData = new FormData();
    formData.append("listId", listId);
    formData.append("boardId", boardId);
    formData.append("title", newTitle);

    setPendingActions((prev) => prev + 1);
    try {
      const result = await renameList(formData);
      if (result?.error) {
        toast.error(result.error);
        setData((prev) => ({
          ...prev,
          lists: {
            ...prev.lists,
            [listId]: { ...prev.lists[listId], title: oldTitle },
          },
        }));
      }
    } catch (error) {
      console.error("Failed to execute renameList:", error);
      toast.error("An unexpected error occurred.");
      setData((prev) => ({
        ...prev,
        lists: {
          ...prev.lists,
          [listId]: { ...prev.lists[listId], title: oldTitle },
        },
      }));
    } finally {
      setPendingActions((prev) => prev - 1);
    }
  };

  const handleRenameCard = async (cardId: string, newTitle: string) => {
    const oldTitle = data.cards[cardId].title;
    if (oldTitle === newTitle.trim() || !newTitle.trim()) return;

    setData((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [cardId]: { ...prev.cards[cardId], title: newTitle },
      },
    }));

    const formData = new FormData();
    formData.append("cardId", cardId);
    formData.append("boardId", boardId);
    formData.append("title", newTitle);

    setPendingActions((prev) => prev + 1);
    try {
      const result = await renameCard(formData);
      if (result?.error) {
        toast.error(result.error);
        setData((prev) => ({
          ...prev,
          cards: {
            ...prev.cards,
            [cardId]: { ...prev.cards[cardId], title: oldTitle },
          },
        }));
      }
    } catch (error) {
      console.error("Failed to execute renameCard:", error);
      toast.error("An unexpected error occurred.");
      setData((prev) => ({
        ...prev,
        cards: {
          ...prev.cards,
          [cardId]: { ...prev.cards[cardId], title: oldTitle },
        },
      }));
    } finally {
      setPendingActions((prev) => prev - 1);
    }
  };

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (
        !result.destination ||
        (result.destination.droppableId === result.source.droppableId &&
          result.destination.index === result.source.index)
      ) {
        return;
      }

      const oldData = structuredClone(data);
      let actionPromise: Promise<any>;

      if (result.type === "COLUMN") {
        const newOrder = Array.from(data.listOrder);
        newOrder.splice(result.source.index, 1);
        newOrder.splice(result.destination.index, 0, result.draggableId);
        setData((prev) => ({ ...prev, listOrder: newOrder }));

        const formData = new FormData();
        formData.append("boardId", boardId);
        formData.append("orderedIds", newOrder.join(","));
        actionPromise = reorderLists(formData);
      } else {
        const startList = data.lists[result.source.droppableId];
        const finishList = data.lists[result.destination.droppableId];
        const formData = new FormData();
        formData.append("boardId", boardId);
        formData.append("sourceListId", startList.id);
        formData.append("destListId", finishList.id);

        if (startList === finishList) {
          const newCardIds = Array.from(startList.cardIds);
          newCardIds.splice(result.source.index, 1);
          newCardIds.splice(result.destination.index, 0, result.draggableId);
          setData((prev) => ({
            ...prev,
            lists: {
              ...prev.lists,
              [startList.id]: { ...startList, cardIds: newCardIds },
            },
          }));
          formData.append("sourceCardIds", newCardIds.join(","));
          formData.append("destCardIds", newCardIds.join(","));
        } else {
          const startCardIds = Array.from(startList.cardIds);
          startCardIds.splice(result.source.index, 1);
          const finishCardIds = Array.from(finishList.cardIds);
          finishCardIds.splice(result.destination.index, 0, result.draggableId);
          setData((prev) => ({
            ...prev,
            lists: {
              ...prev.lists,
              [startList.id]: { ...startList, cardIds: startCardIds },
              [finishList.id]: { ...finishList, cardIds: finishCardIds },
            },
          }));
          formData.append("sourceCardIds", startCardIds.join(","));
          formData.append("destCardIds", finishCardIds.join(","));
        }
        actionPromise = reorderCard(formData);
      }

      setPendingActions((prev) => prev + 1);
      actionPromise
        .then((res) => {
          if (res?.error) {
            toast.error(res.error);
            setData(oldData);
          }
        })
        .catch((error) => {
          console.error("DragEnd action failed:", error);
          toast.error("An unexpected error occurred during reorder.");
          setData(oldData);
        })
        .finally(() => {
          setPendingActions((prev) => prev - 1);
        });
    },
    [data, boardId]
  );
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-start h-6 mb-4">
        <SyncIndicator isPending={pendingActions > 0} />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div className="board-scroll no-scrollbar flex h-[calc(100vh-140px)] items-start gap-3 overflow-x-auto pb-6 pr-3">
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex items-start gap-3"
              >
                {lists.map((list, index) => (
                  <Draggable draggableId={list.id} index={index} key={list.id}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={getDraggableStyle(
                          dragProvided?.draggableProps?.style!,
                          dragSnapshot
                        )}
                        className={cn(
                          "flex max-h-[calc(100vh-140px)] w-[272px] min-w-[272px] max-w-[272px] basis-[272px] flex-shrink-0 flex-col",
                          "rounded-md border border-zinc-200 bg-zinc-100/70 p-2 shadow-sm overflow-hidden",
                          "dark:border-zinc-800 dark:bg-zinc-900/50",
                          dragSnapshot.isDragging &&
                            "border-black/40 shadow-lg dark:border-white/50"
                        )}
                      >
                        <ListHeader
                          title={list.title}
                          onRename={(t) => handleRenameList(list.id, t)}
                          dragHandleProps={dragProvided.dragHandleProps!}
                        />
                        <ListCards
                          listId={list.id}
                          cards={list.cardIds.map((cid) => data.cards[cid])}
                          onAddCard={(t) => handleAddCard(list.id, t)}
                          onRenameCard={handleRenameCard}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>

              <div className="w-[272px] flex-shrink-0">
                {addingList ? (
                  <div className="rounded-md border border-zinc-200 bg-zinc-100/70 p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                    <Input
                      ref={listInputRef}
                      autoFocus
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddList(newListTitle);
                        } else if (e.key === "Escape") {
                          setAddingList(false);
                          setNewListTitle("");
                        }
                      }}
                      placeholder="Enter list title..."
                      className="mb-2 bg-white dark:bg-zinc-900"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddList(newListTitle)}
                        className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                      >
                        Add list
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Cancel add list"
                        onClick={() => {
                          setAddingList(false);
                          setNewListTitle("");
                        }}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingList(true)}
                    className="flex w-full items-center gap-2 rounded-md bg-zinc-100/60 p-3 text-left text-sm text-zinc-700 transition hover:bg-zinc-200/80 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-900/70"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add another list</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </div>
  );
}
