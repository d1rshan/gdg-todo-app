import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Board } from "@/types";
import { useModal } from "@/hooks/use-modal";

import { createBoard } from "../server/actions";

export const useCreateBoard = () => {
  const router = useRouter();

  const { onClose } = useModal();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title }: { title: string }) => createBoard({ title }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      onClose();
      router.push(`/boards/${data.id}`);
    },
  });
};
