export type List = {
  id: string;
  title: string;
  cards: Card[];
  order: number;
  boardId: string;
};

export type Card = {
  id: string;
  title: string;
  listId: string;
  order: number;
  boardId: string;
};

export type Board = {
  id: string;
  name: string;
  lists?: List[];
};
