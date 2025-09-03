import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { renameBoard } from "../server/actions";

export const useRenameBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, title }: { boardId: string; title: string }) =>
      renameBoard({ boardId, title }),
    onSuccess: () => {
      toast.success("Board Modified!");
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
};
