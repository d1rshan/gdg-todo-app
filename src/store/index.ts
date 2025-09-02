import { create } from "zustand";

import { List, Card, Board } from "@/types";

export type StoreType = {
  boards: Board[];
  setBoards: (boards: Board[]) => void;

  addBoard: (board: Board) => void;
  deleteBoard: (boardId: string) => void;
  renameBoard: (boardId: string, title: string) => void;

  lists: List[];
  setLists: (list: List[], boardId: string) => void;

  addList: (list: List) => void;
  deleteList: (listId: string, boardId: string) => void;
  renameList: (listId: string, title: string, boardId: string) => void;
  moveList: (listId: string, boardId: string) => void;

  addCard: (card: Card, listId: string) => void;
  deleteCard: (cardId: string, listId: string) => void;
  renameCard: (cardId: string, title: string, listId: string) => void;
  insertCard: (
    card: Card,
    position: "above" | "below",
    cardId: string,
    newId: string
  ) => void;
};

export const useStore = create<StoreType>((set, get) => ({
  boards: [],
  setBoards: (boards) => set({ boards: boards }),
  addBoard: (board: Board) =>
    set((state) => ({ boards: [...state.boards, board] })),
  deleteBoard: (boardId: string) =>
    set((state) => {
      const updatedBoards = state.boards.filter(
        (board) => board.id !== boardId
      );
      return {
        boards: updatedBoards,
      };
    }),
  renameBoard: (boardId: string, title: string) =>
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId ? { ...board, name: title } : board
      ),
    })),
  updateBoard: (boardId: string, updatedBoard: Partial<Board>) =>
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId ? { ...board, ...updatedBoard } : board
      ),
    })),

  lists: [],
  setLists: (lists, boardId) =>
    set({ lists: lists.filter((list) => list.boardId === boardId) }),
  addList: (list) => set((state) => ({ lists: [...state.lists, list] })),
  deleteList: (listId, boardId) =>
    set((state) => ({
      lists: state.lists.filter(
        (list) => list.id !== listId && list.boardId === boardId
      ),
    })),
  renameList: (listId, title, boardId) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId && list.boardId === boardId
          ? { ...list, title }
          : list
      ),
    })),
  moveList: (listId, boardId) => {
    const { lists } = get();
    const listIndex = lists.findIndex((list) => list.id === listId);

    if (listIndex !== -1) {
      set({
        lists: [...lists.slice(0, listIndex), ...lists.slice(listIndex + 1)],
      });
    }
  },

  addCard: (card, listId) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId ? { ...list, cards: [...list.cards, card] } : list
      ),
    })),
  deleteCard: (cardId, listId) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId
          ? { ...list, items: list.cards.filter((card) => card.id !== cardId) }
          : list
      ),
    })),
  renameCard: (cardId, title, listId) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              cards: list.cards.map((card) =>
                card.id === cardId ? { ...card, title } : card
              ),
            }
          : list
      ),
    })),
  insertCard: (card, position, cardId, newId) =>
    set((state) => {
      const { lists } = state;
      const listIndex = lists.findIndex((list) =>
        list.cards.some((card) => card.id === cardId)
      );

      if (listIndex !== -1) {
        const list = lists[listIndex];
        const cardIndex = list.cards.findIndex((card) => card.id === cardId);

        if (cardIndex !== -1) {
          const updatedItems = list.cards.map((existingCard, index) => {
            if (
              (position === "above" && index >= cardIndex) ||
              (position !== "above" && index > cardIndex)
            ) {
              return { ...existingCard, order: existingCard.order + 1 };
            } else {
              return existingCard;
            }
          });

          const newCardOrder = position === "above" ? cardIndex : cardIndex + 1;
          const newCard = { ...card, order: newCardOrder };

          updatedItems.splice(newCardOrder, 0, newCard);

          lists[listIndex] = { ...list, cards: updatedItems };

          return { ...state, lists };
        }
      }
      return state;
    }),
}));
