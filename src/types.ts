export type Board = {
  id: string;
  title: string;
};

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

export type BoardData = {
  lists: Record<string, { id: string; title: string; cardIds: string[] }>;
  cards: Record<string, { id: string; title: string }>;
  listOrder: string[];
};
