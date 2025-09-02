import { create } from "zustand";

export type ModalType = "createBoard" | "editBoard" | "deleteBoard";

interface ModalStore {
  type: ModalType | null;
  data: {
    boardId?: string;
    boardTitle?: string;
  };
  isOpen: boolean;
  onOpen: (
    type: ModalType,
    data?: { boardId?: string; boardTitle?: string }
  ) => void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type, data) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
}));
