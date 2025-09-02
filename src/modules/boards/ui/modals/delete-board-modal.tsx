import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useModal } from "@/hooks/use-modal";

import { deleteBoardAction } from "../../server/actions";

import { useStore } from "@/hooks/use-store";

export function DeleteBoardModal() {
  const { isOpen, onClose, data, type } = useModal();
  const deleteBoard = useStore((state) => state.deleteBoard);

  const isModalOpen = isOpen && type === "deleteBoard";

  const { boardTitle, boardId } = data;

  const onClick = async () => {
    await deleteBoardAction({ boardId: boardId! });
    onClose();
    deleteBoard(boardId!);
  };
  return (
    <AlertDialog open={isModalOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{boardTitle} </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onClick}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
