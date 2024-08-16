import { randomBytes } from "crypto";
import { z } from "zod";

import { TKmsServiceFactory } from "../kms/kms-service";
import { KmsDataKey } from "../kms/kms-types";
import { TUserSecretsDALFactory } from "./user-secrets-dal";
import { UserSecretType } from "./user-secrets-enums";
import { userSecretsResponseSchema } from "./user-secrets-schemas";
import { TCreateUserSecretDTO } from "./user-secrets-types";

type TUserSecretsServiceFactoryDep = {
  kmsService: Pick<TKmsServiceFactory, "createCipherPairWithDataKey">;
  userSecretsDAL: TUserSecretsDALFactory;
};

export type TUserSecretsServiceFactory = ReturnType<typeof userSecretsServiceFactory>;

export const userSecretsServiceFactory = ({ kmsService, userSecretsDAL }: TUserSecretsServiceFactoryDep) => {
  const encryptUserSecret = async (inputData: TCreateUserSecretDTO) => {
    const iv = randomBytes(16).toString("hex");
    const { encryptor: userSecretEncryptor } = await kmsService.createCipherPairWithDataKey({
      type: KmsDataKey.UserSecret,
      actorId: iv + inputData.actorId
    });

    return {
      userId: inputData.actorId,
      orgId: inputData.orgId,
      secretType: inputData.secretType,
      name: inputData.name,
      encryptedData: userSecretEncryptor({ plainText: Buffer.from(JSON.stringify(inputData.data)) }).cipherTextBlob,
      iv
    };
  };

  const decryptUserSecret = async (fetchedData: Awaited<ReturnType<typeof userSecretsDAL.findOne>>) => {
    const { iv, encryptedData } = fetchedData;
    const { decryptor: userSecretDecryptor } = await kmsService.createCipherPairWithDataKey({
      type: KmsDataKey.UserSecret,
      actorId: iv + fetchedData.userId
    });

    type ResponseType = z.infer<typeof userSecretsResponseSchema>;
    const response: ResponseType = {
      id: fetchedData.id,
      name: fetchedData.name,
      userId: fetchedData.userId,
      orgId: fetchedData.orgId,
      updatedAt: fetchedData.updatedAt,
      createdAt: fetchedData.createdAt,
      secretType: fetchedData.secretType as UserSecretType,
      data: JSON.parse(userSecretDecryptor({ cipherTextBlob: encryptedData }).toString()) as ResponseType["data"]
    };

    return response;
  };

  const createUserSecret = async (inputData: TCreateUserSecretDTO) => {
    const encryptedUserSecret = await encryptUserSecret(inputData);

    const newUserSecret = await userSecretsDAL.create(encryptedUserSecret);

    return newUserSecret;
  };

  const updateUserSecret = async (id: string, inputData: TCreateUserSecretDTO) => {
    const encryptedUserSecret = await encryptUserSecret(inputData);

    const secret = await userSecretsDAL.updateById(id, encryptedUserSecret);
    return secret;
  };

  const getAllUserSecrets = async (
    userId: string,
    {
      offset,
      limit,
      secretType,
      search
    }: { offset: number; limit: number; secretType?: UserSecretType; search?: string }
  ) => {
    const filter = { userId, secretType, search };
    if (!secretType) {
      delete filter.secretType;
    }
    if (!search) {
      delete filter.search;
    }

    const count = await userSecretsDAL.countUserSecrets(filter);
    const secrets = await userSecretsDAL.findAll({ ...filter, offset, limit });
    const decryptedSecrets = await Promise.all(secrets.map(decryptUserSecret));

    return { count, secrets: decryptedSecrets };
  };

  const deleteUserSecret = async (id: string) => {
    const deletedSecret = await userSecretsDAL.deleteById(id);
    return deletedSecret;
  };

  return {
    createUserSecret,
    updateUserSecret,
    getAllUserSecrets,
    deleteUserSecret
  };
};
