// Code generated by automation script, DO NOT EDIT.
// Automated by pulling database and generating zod schema
// To update. Just run npm run generate:schema
// Written by akhilmhdh.

import { z } from "zod";

import { TImmutableDBKeys } from "./models";

export const SecretImportsSchema = z.object({
  id: z.string().uuid(),
  version: z.number().default(1).nullable().optional(),
  importPath: z.string(),
  importEnv: z.string().uuid(),
  position: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  folderId: z.string().uuid(),
});

export type TSecretImports = z.infer<typeof SecretImportsSchema>;
export type TSecretImportsInsert = Omit<TSecretImports, TImmutableDBKeys>;
export type TSecretImportsUpdate = Partial<Omit<TSecretImports, TImmutableDBKeys>>;