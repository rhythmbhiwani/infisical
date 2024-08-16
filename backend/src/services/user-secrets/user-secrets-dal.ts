import { TDbClient } from "@app/db";
import { TableName } from "@app/db/schemas";
import { DatabaseError } from "@app/lib/errors";
import { ormify } from "@app/lib/knex";

import { UserSecretType } from "./user-secrets-enums";

export type TUserSecretsDALFactory = ReturnType<typeof userSecretsDALFactory>;

export const userSecretsDALFactory = (db: TDbClient) => {
  const userSecretsOrm = ormify(db, TableName.UserSecrets);

  const countUserSecrets = async ({
    secretType,
    userId,
    search
  }: {
    secretType?: UserSecretType;
    userId: string;
    search?: string;
  }) => {
    try {
      interface CountResult {
        count: string;
      }

      const query = db.replicaNode()(TableName.UserSecrets).where(`${TableName.UserSecrets}.userId`, userId);

      // Conditionally add the secretType filter if it is provided
      if (secretType) {
        void query.where(`${TableName.UserSecrets}.secretType`, secretType);
      }

      // Conditionally add the search filter if a search term is provided
      if (search) {
        // Use a case-insensitive regex pattern for the search
        void query.andWhereRaw("LOWER(name) LIKE ?", [`%${search.toLowerCase()}%`]);
      }

      const count = await query.count("*").first();

      return parseInt((count as unknown as CountResult).count || "0", 10);
    } catch (error) {
      throw new DatabaseError({ error, name: "Count all user secrets secrets" });
    }
  };

  const findAll = async ({
    secretType,
    userId,
    search,
    limit,
    offset
  }: {
    secretType?: UserSecretType;
    userId: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      const query = db.replicaNode()(TableName.UserSecrets).where(`${TableName.UserSecrets}.userId`, userId);

      if (secretType) {
        void query.where(`${TableName.UserSecrets}.secretType`, secretType);
      }

      if (search) {
        void query.andWhereRaw("LOWER(name) LIKE ?", [`%${search.toLowerCase()}%`]);
      }

      if (limit !== undefined) {
        void query.limit(limit);
      }

      if (offset !== undefined) {
        void query.offset(offset);
      }

      const results = await query.select();

      return results;
    } catch (error) {
      throw new DatabaseError({ error, name: "Find all user secrets" });
    }
  };

  return {
    ...userSecretsOrm,
    findAll,
    countUserSecrets
  };
};
