import { z } from "zod";

export const inquirySchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  contact_name: z.string().min(1, "Your name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  location: z.string().optional(),
  message: z.string().optional(),
});

export type InquiryValues = z.infer<typeof inquirySchema>;
