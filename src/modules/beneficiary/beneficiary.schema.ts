import { z } from "zod";

export const applySchema = z.object({
  schemeId: z.string().min(1)
});

export const uploadDocsSchema = z.object({
  documents: z.array(z.string().url()).min(1)
});

export type ApplyInput = z.infer<typeof applySchema>;
export type UploadDocsInput = z.infer<typeof uploadDocsSchema>;
