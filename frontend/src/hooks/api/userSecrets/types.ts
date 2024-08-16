import { z } from "zod";

import { UserSecretType } from "./enum";
import { userSecretSchema } from "./schema";

export type TUserSecret = {
  id: string;
  secretType: UserSecretType;
  name: string;
  userId: string;
  orgId: string;
  data: {
    loginURL: null | string;
    username: null | string;
    password: null | string;
    cardNumber: null | string;
    cardExpiry: null | string;
    cardCvv: null | string;
    secureNote: null | string;
    wifiPassword: null | string;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type TUserSecretRequest = z.infer<typeof userSecretSchema>;

export type TUserSecretResponse = {
  id: string;
};
