"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { demoteToStaff } from "@/app/actions/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type TeamMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "super_admin" | "staff";
};

export function TeamTable({ members, currentUserId }: { members: TeamMember[]; currentUserId: string }) {
  const router = useRouter();

  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No team members yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const isSelf = member.id === currentUserId;
          return (
            <TableRow key={member.id}>
              <TableCell className="font-medium">
                {member.full_name || "—"}
                {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
              </TableCell>
              <TableCell>{member.email || "—"}</TableCell>
              <TableCell>
                <Badge variant={member.role === "super_admin" ? "default" : "secondary"}>
                  {member.role}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {member.role === "super_admin" && !isSelf && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        await demoteToStaff(member.id);
                        toast.success("Demoted to staff");
                        router.refresh();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to update role");
                      }
                    }}
                  >
                    Demote to staff
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
