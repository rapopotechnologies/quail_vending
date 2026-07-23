"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createMachine, updateMachine } from "@/app/actions/machines";
import { machineSchema, type MachineValues } from "@/lib/validations/machine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/shared/image-upload";
import type { Tables } from "@/lib/supabase/types";

type Machine = Tables<"machines">;

export function MachineFormDialog({ machine }: { machine?: Machine }) {
  const [open, setOpen] = useState(false);
  const [uploadId] = useState(() => machine?.id ?? crypto.randomUUID());
  const router = useRouter();
  const isEdit = !!machine;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MachineValues>({
    resolver: zodResolver(machineSchema),
    defaultValues: machine
      ? {
          name: machine.name,
          location: machine.location ?? "",
          address: machine.address ?? "",
          profit_share_pct: machine.profit_share_pct,
          status: machine.status as MachineValues["status"],
          image_url: machine.image_url,
        }
      : { name: "", location: "", address: "", status: "active", image_url: null },
  });

  async function onSubmit(values: MachineValues) {
    try {
      if (isEdit) {
        await updateMachine(machine.id, values);
        toast.success("Machine updated");
      } else {
        await createMachine(values);
        toast.success("Machine created");
        reset();
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdit ? "outline" : "default"} size="sm">
          {isEdit ? "Edit" : "Add machine"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit machine" : "Add machine"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Photo</Label>
            <ImageUpload
              bucket="machine-images"
              pathPrefix={uploadId}
              value={watch("image_url") ?? null}
              onChange={(url) => setValue("image_url", url)}
            />
            <p className="text-xs text-muted-foreground">
              Shown on the public landing page for active machines.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location note</Label>
            <Input id="location" placeholder="Bldg 4 Lobby" {...register("location")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="500 Main St, Springfield"
              {...register("address")}
            />
            <p className="text-xs text-muted-foreground">
              Shown on the public landing page for active machines.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profit_share_pct">Profit share % (owed to location)</Label>
            <Input
              id="profit_share_pct"
              type="number"
              step="0.01"
              {...register("profit_share_pct")}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={watch("status")}
              onValueChange={(v) => setValue("status", v as MachineValues["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
