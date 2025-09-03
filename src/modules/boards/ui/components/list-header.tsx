import { useEffect, useState } from "react";
import { GripVertical, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

export function ListHeader({
  title = "List",
  onRename = () => {},
  dragHandleProps,
}: {
  title?: string;
  onRename?: (title: string) => void;
  dragHandleProps?: DraggableProvidedDragHandleProps;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(title);

  useEffect(() => setVal(title), [title]);

  const handleSave = () => {
    if (val.trim()) onRename(val.trim());
    setEditing(false);
  };

  return (
    <div className="mb-2 flex items-center gap-2">
      <div className="flex flex-1 items-center gap-2">
        <button
          className="cursor-grab text-zinc-400 hover:text-zinc-500"
          aria-label="Drag list"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {editing ? (
          <Input
            value={val}
            autoFocus
            onChange={(e) => setVal(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              else if (e.key === "Escape") {
                setVal(title);
                setEditing(false);
              }
            }}
            className="h-7 w-full border border-zinc-300 bg-white px-1 py-0 text-sm leading-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:border-zinc-700 dark:bg-zinc-900"
            aria-label="List title"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="line-clamp-1 cursor-text rounded px-1 text-sm font-medium text-zinc-800 hover:bg-white/60 dark:text-zinc-100 dark:hover:bg-white/5"
            title="Click to rename"
          >
            {title}
          </button>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-zinc-500"
        aria-label="List menu"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
