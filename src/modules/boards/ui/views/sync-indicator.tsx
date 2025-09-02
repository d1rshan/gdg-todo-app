import { Loader2, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export function SyncIndicator({ isPending }: { isPending: boolean }) {
  // This state prevents the "All changes saved" message from showing on initial page load.
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Once the first action is initiated, we should always show the indicator's status.
    if (isPending) {
      setShowIndicator(true);
    }
  }, [isPending]);

  // Don't render anything until an action has been performed.
  // if (!showIndicator) {
  //   return null;
  // }

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>All changes saved</span>
        </>
      )}
    </div>
  );
}
