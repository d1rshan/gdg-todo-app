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

import { createBoardAction } from "../../server/actions";
import { useState } from "react";
import { useStore } from "@/hooks/use-store";

const formSchema = z.object({
  title: z.string().min(1, { error: "Board Title is Required" }).max(30),
});

export function CreateBoardModal() {
  const { isOpen, type, onClose } = useModal();

  const addBoard = useStore((state) => state.addBoard);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isModalOpen = isOpen && type === "createBoard";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    form.reset();
    const res = await createBoardAction({ title: values.title });
    const board = res.data!;

    if (!res?.error) {
      addBoard({ title: board.title, id: board.id });
    }

    // if (res?.error){  // for fallbacks, when using optimistic updates
    //   removeBoard(newBoard.id)
    // }

    onClose();
    setIsLoading(false);
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Board</DialogTitle>
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
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
