// /components/kanban-board.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, GripVertical, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Recommended for user feedback

import { v4 as uuidv4 } from "uuid";

// --- SERVER ACTION IMPORTS ---
import {
  createCard,
  createList,
  reorderCard,
  renameCard,
  renameList,
  reorderLists,
} from "@/actions";
import { SyncIndicator } from "./sync-indicator";

// --- HELPERS ---

// dnd style helper
function getDraggableStyle(
  style: any,
  snapshot: { isDragging: boolean; isDropAnimating: boolean }
) {
  if (!style) return style;
  if (snapshot.isDropAnimating) {
    // Snap in place instantly on drop
    return { ...style, transitionDuration: "0.001s" };
  }
  if (snapshot.isDragging) {
    return { ...style, willChange: "transform" };
  }
  return style;
}

// --- DATA TYPES ---

// These types reflect the data structure fetched from the server
export type Card = {
  id: string;
  title: string;
  order: number;
  listId: string;
};

export type List = {
  id: string;
  title: string;
  order: number;
  cards: Card[];
};

// This is the normalized shape the component will manage internally for easier state updates
type BoardData = {
  lists: Record<string, { id: string; title: string; cardIds: string[] }>;
  cards: Record<string, { id: string; title: string }>;
  listOrder: string[];
};

// --- DATA TRANSFORMATION ---

// Helper to transform the initial server data into the normalized shape our component uses
const transformInitialData = (initialLists: List[]): BoardData => {
  const lists: BoardData["lists"] = {};
  const cards: BoardData["cards"] = {};
  const listOrder = initialLists.map((list) => list.id);

  initialLists.forEach((list) => {
    lists[list.id] = { id: list.id, title: list.title, cardIds: [] };
    // Ensure cards are sorted by their `order` property before mapping
    list.cards
      .sort((a, b) => a.order - b.order)
      .forEach((card) => {
        cards[card.id] = { id: card.id, title: card.title };
        lists[list.id].cardIds.push(card.id);
      });
  });

  return { lists, cards, listOrder };
};

// --- MAIN COMPONENT ---
export default function KanbanBoard({
  initialData: initialLists,
  boardId,
}: {
  initialData: List[];
  boardId: string;
}) {
  const [data, setData] = useState<BoardData>(() =>
    transformInitialData(initialLists)
  );

  // Sync state if the initial server-fetched data prop changes
  useEffect(() => {
    setData(transformInitialData(initialLists));
  }, [initialLists]);

  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const listInputRef = useRef<HTMLInputElement | null>(null);

  // 2. Add state to track pending database operations
  const [pendingActions, setPendingActions] = useState(0);
  // const isPending = pendingActions > 0;

  const lists = useMemo(
    () => data.listOrder.map((id) => data.lists[id]),
    [data]
  );

  // --- SERVER ACTION HANDLERS ---
  const handleAddList = async (title: string) => {
    if (!title.trim()) return;
    const newId = uuidv4();

    // Optimistic update
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
        // Revert state on a known error from the server
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
      // Catch unexpected errors (e.g., network failure)
      console.error("Failed to execute createList:", error);
      toast.error("An unexpected error occurred.");
      // You might want to revert state here as well
    } finally {
      // This is guaranteed to run, ensuring the counter is decremented
      setPendingActions((prev) => prev - 1);
    }
  };

  const handleAddCard = async (listId: string, title: string) => {
    if (!title.trim()) return;
    const newId = uuidv4();

    // Optimistic update
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
        // Revert state
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
    } finally {
      setPendingActions((prev) => prev - 1);
    }
  };

  const handleRenameList = async (listId: string, newTitle: string) => {
    const oldTitle = data.lists[listId].title;
    if (oldTitle === newTitle.trim() || !newTitle.trim()) return;

    // Optimistic update
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
        // Revert on error
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
    } finally {
      setPendingActions((prev) => prev - 1);
    }
  };

  const handleRenameCard = async (cardId: string, newTitle: string) => {
    const oldTitle = data.cards[cardId].title;
    if (oldTitle === newTitle.trim() || !newTitle.trim()) return;

    // Optimistic update
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

      // Perform optimistic update and prepare the server action
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
        // Card drag logic...
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

      // Increment counter and handle promise with .finally()
      setPendingActions((prev) => prev + 1);
      actionPromise
        .then((res) => {
          if (res?.error) {
            toast.error(res.error);
            setData(oldData); // Revert on known error
          }
        })
        .catch((error) => {
          console.error("DragEnd action failed:", error);
          toast.error("An unexpected error occurred during reorder.");
          setData(oldData); // Revert on unexpected error
        })
        .finally(() => {
          // This is guaranteed to run for promises
          setPendingActions((prev) => prev - 1);
        });
    },
    [data, boardId]
  );
  // --- RENDER ---
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-end h-6 mb-4">
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
                          dragProvided.draggableProps.style,
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
                          dragHandleProps={dragProvided.dragHandleProps}
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

// --- CHILD COMPONENTS ---

function ListHeader({
  title = "List",
  onRename = () => {},
  dragHandleProps,
}: {
  title?: string;
  onRename?: (title: string) => void;
  dragHandleProps?: any;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(title);

  useEffect(() => setVal(title), [title]);

  const handleSave = () => {
    if (val.trim()) onRename(val.trim());
    setEditing(false);
  };

  return (
    <div className="mb-2 flex items-center gap-2">
      <div className="flex flex-1 items-center gap-2">
        <button
          className="cursor-grab text-zinc-400 hover:text-zinc-500"
          aria-label="Drag list"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {editing ? (
          <Input
            value={val}
            autoFocus
            onChange={(e) => setVal(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              else if (e.key === "Escape") {
                setVal(title);
                setEditing(false);
              }
            }}
            className="h-7 w-full border border-zinc-300 bg-white px-1 py-0 text-sm leading-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:border-zinc-700 dark:bg-zinc-900"
            aria-label="List title"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="line-clamp-1 cursor-text rounded px-1 text-sm font-medium text-zinc-800 hover:bg-white/60 dark:text-zinc-100 dark:hover:bg-white/5"
            title="Click to rename"
          >
            {title}
          </button>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-zinc-500"
        aria-label="List menu"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ListCards({
  listId = "list-0",
  cards = [],
  onAddCard = () => {},
  onRenameCard = () => {},
}: {
  listId?: string;
  cards?: { id: string; title: string }[];
  onAddCard?: (title: string) => void;
  onRenameCard?: (cardId: string, title: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  function startEdit(card: { id: string; title: string }) {
    setEditingId(card.id);
    setEditingText(card.title);
    setAdding(false);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }
  function saveEdit() {
    if (editingId && editingText.trim()) {
      onRenameCard(editingId, editingText.trim());
    }
    cancelEdit();
  }

  const scrollRef = useRef<HTMLDivElement | null>(null);
  function scrollToBottom() {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    if (adding) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [adding]);
  useEffect(() => {
    if (adding) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [cards.length, adding]);

  function handleConfirmAdd() {
    if (text.trim()) {
      onAddCard(text);
      setText("");
      requestAnimationFrame(scrollToBottom);
    }
  }

  return (
    <Droppable droppableId={listId} type="CARD">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="flex min-h-0 flex-1 flex-col pr-1"
        >
          <div
            ref={scrollRef}
            className="no-scrollbar min-h-0 flex-1 overflow-y-auto"
          >
            <div
              className={cn(
                "flex flex-col gap-2",
                snapshot.isDraggingOver &&
                  "rounded-md bg-black/5 p-1 dark:bg-white/10"
              )}
            >
              {cards.map((card, index) => (
                <Draggable draggableId={card.id} index={index} key={card.id}>
                  {(dragProvided, dragSnapshot) => {
                    const isEditing = editingId === card.id;
                    return (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        style={getDraggableStyle(
                          dragProvided.draggableProps.style,
                          dragSnapshot
                        )}
                        className={cn(
                          "rounded-md border border-zinc-200 bg-white text-sm text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-900/80",
                          dragSnapshot.isDragging &&
                            "border-black/40 dark:border-white/50"
                        )}
                        onDoubleClick={() => startEdit(card)}
                      >
                        {isEditing ? (
                          <div className="p-2">
                            <Textarea
                              value={editingText}
                              autoFocus
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  if (editingText.trim()) saveEdit();
                                } else if (e.key === "Escape") {
                                  cancelEdit();
                                }
                              }}
                              placeholder="Edit card title..."
                              className="mb-2 min-h-[64px] resize-none bg-white dark:bg-zinc-900"
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={saveEdit}
                                className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                              >
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Discard edit"
                                onClick={cancelEdit}
                              >
                                <X className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="min-h-[36px] whitespace-pre-wrap p-2">
                            {card.title}
                          </div>
                        )}
                      </div>
                    );
                  }}
                </Draggable>
              ))}
              {snapshot.isDraggingOver && provided.placeholder}
              {adding && (
                <div className="rounded-md bg-white p-2 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                  <Textarea
                    value={text}
                    autoFocus
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleConfirmAdd();
                      } else if (e.key === "Escape") {
                        setAdding(false);
                        setText("");
                      }
                    }}
                    placeholder="Enter a title for this card..."
                    className="mb-2 min-h-[64px] resize-none bg-white dark:bg-zinc-900"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleConfirmAdd}
                      className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                      Add card
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Cancel add card"
                      onClick={() => {
                        setAdding(false);
                        setText("");
                      }}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2">
            {!adding && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setAdding(true);
                }}
                className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm text-zinc-600 transition hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
              >
                <Plus className="h-4 w-4" />
                <span>Add a card</span>
              </button>
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
}
