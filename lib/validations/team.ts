import { z } from "zod";

export const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["staff", "super_admin"]),
});

export type InviteValues = z.infer<typeof inviteSchema>;
