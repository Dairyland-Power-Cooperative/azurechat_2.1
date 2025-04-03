import { z } from "zod";

// Define email validation schema
export const EmailSchema = z.string().email("Invalid email format");

// Define access types
export const AccessTypeSchema = z.enum(["INDIVIDUAL", "GROUP"]);
export type AccessType = z.infer<typeof AccessTypeSchema>;

// Schema for access control entries
export const AccessControlEntrySchema = z.object({
  id: z.string(),
  value: z.string().min(1, "Access value cannot be empty"),
  type: AccessTypeSchema,
});

export type AccessControlEntry = z.infer<typeof AccessControlEntrySchema>;
