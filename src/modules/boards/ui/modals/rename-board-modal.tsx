"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from "react";
import { renameBoardAction } from "../../server/actions";
import { useStore } from "@/hooks/use-store";

const formSchema = z.object({
  title: z.string().min(1, { error: "Board Title is Required" }).max(30),
});

export function EditBoardModal() {
  const { isOpen, onClose, type, data } = useModal();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isModalOpen = isOpen && type === "editBoard";

  const { boardId, boardTitle } = data;

  const renameBoard = useStore((state) => state.renameBoard);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: boardTitle!,
    },
  });

  useEffect(() => {
    if (!boardTitle) return;
    form.setValue("title", boardTitle);
  }, [boardTitle]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const { title } = values;
    if (!boardId) {
      return;
    }
    await renameBoardAction({ boardId, title });
    renameBoard(boardId, title);
    form.reset();
    setIsLoading(false);
    onClose();
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Board</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Board Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
