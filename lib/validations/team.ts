import { z } from "zod";

export const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export type InviteValues = z.infer<typeof inviteSchema>;
