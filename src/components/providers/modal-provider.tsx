"use client";

import { useEffect, useState } from "react";

import { CreateBoardModal } from "@/modules/boards/ui/modals/create-board-modal";
import { DeleteBoardModal } from "@/modules/boards/ui/modals/delete-board-modal";
import { EditBoardModal } from "@/modules/boards/ui/modals/rename-board-modal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }
  return (
    <>
      <CreateBoardModal />
      <EditBoardModal />
      <DeleteBoardModal />
    </>
  );
};
