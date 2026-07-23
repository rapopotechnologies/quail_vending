"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteInquiry, updateInquiryStatus } from "@/app/actions/inquiries";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/lib/supabase/types";

type Inquiry = Tables<"partner_inquiries">;

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  new: "default",
  contacted: "secondary",
  closed: "destructive",
};

export function LeadsTable({ inquiries, canDelete }: { inquiries: Inquiry[]; canDelete: boolean }) {
  const router = useRouter();

  if (inquiries.length === 0) {
    return <p className="text-sm text-muted-foreground">No inquiries yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Business</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Received</TableHead>
          <TableHead>Status</TableHead>
          {canDelete && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {inquiries.map((inquiry) => (
          <TableRow key={inquiry.id}>
            <TableCell className="font-medium">{inquiry.business_name}</TableCell>
            <TableCell>
              <div>{inquiry.contact_name}</div>
              <div className="text-sm text-muted-foreground">{inquiry.email}</div>
              {inquiry.phone && (
                <div className="text-sm text-muted-foreground">{inquiry.phone}</div>
              )}
            </TableCell>
            <TableCell>{inquiry.location || "—"}</TableCell>
            <TableCell className="max-w-xs truncate">{inquiry.message || "—"}</TableCell>
            <TableCell>{new Date(inquiry.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <Select
                value={inquiry.status}
                onValueChange={async (v) => {
                  try {
                    await updateInquiryStatus(inquiry.id, v as "new" | "contacted" | "closed");
                    router.refresh();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to update");
                  }
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue>
                    <Badge variant={STATUS_VARIANT[inquiry.status] ?? "secondary"}>
                      {inquiry.status}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            {canDelete && (
              <TableCell className="text-right">
                <DeleteConfirmButton
                  confirmMessage={`Delete the inquiry from "${inquiry.business_name}"?`}
                  onDelete={async () => {
                    await deleteInquiry(inquiry.id);
                    toast.success("Inquiry deleted");
                    router.refresh();
                  }}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
