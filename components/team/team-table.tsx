"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateProfileRole } from "@/app/actions/team";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
                {isSelf ? (
                  <Badge variant={member.role === "super_admin" ? "default" : "secondary"}>
                    {member.role}
                  </Badge>
                ) : (
                  <Select
                    value={member.role}
                    onValueChange={async (v) => {
                      try {
                        await updateProfileRole(member.id, v as "staff" | "super_admin");
                        toast.success("Role updated");
                        router.refresh();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to update role");
                      }
                    }}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="super_admin">Super admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
