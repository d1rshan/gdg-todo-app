import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteBoard } from "../server/actions";
import { Board } from "@/types";

export const useDeleteBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId }: { boardId: string }) => deleteBoard({ boardId }),
    onSuccess: (data: Board) => {
      toast.success(`${data.title} deleted!`);
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
};
