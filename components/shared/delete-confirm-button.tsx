"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteConfirmButton({
  onDelete,
  confirmMessage = "Delete this? This can't be undone.",
  label = "Delete",
  iconOnly = false,
}: {
  onDelete: () => Promise<void>;
  confirmMessage?: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await onDelete();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  const trigger = iconOnly ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="icon" aria-label={label} disabled={pending}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  ) : (
    <AlertDialogTrigger asChild>
      <Button variant="ghost" size="sm" disabled={pending}>
        {pending ? "Deleting..." : label}
      </Button>
    </AlertDialogTrigger>
  );

  return (
    <AlertDialog>
      {trigger}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
