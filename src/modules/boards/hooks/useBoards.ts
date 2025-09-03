import { useQuery } from "@tanstack/react-query";

import { Board } from "@/types";

import { getBoards } from "../server/actions";

export const useBoards = () => {
  return useQuery({
    queryKey: ["boards"],
    queryFn: getBoards,
  });
};
