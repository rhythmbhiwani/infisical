import { z } from "zod";

import { UserSecretType } from "./user-secrets-enums";
import { creditCardDataSchema, loginDataSchema, secureNoteDataSchema, wifiDataSchema } from "./user-secrets-schemas";

export type EncryptedDataType =
  | z.infer<typeof loginDataSchema>
  | z.infer<typeof creditCardDataSchema>
  | z.infer<typeof secureNoteDataSchema>
  | z.infer<typeof wifiDataSchema>;

export type TCreateUserSecretDTO = {
  actorId: string;
  orgId: string;
  secretType: UserSecretType;
  name: string;
  data: EncryptedDataType;
};
