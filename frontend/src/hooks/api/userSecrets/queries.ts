import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@app/config/request";

import { UserSecretType } from "./enum";
import { TUserSecret } from "./types";

export const userSecretKeys = {
  allUserSecrets: () => ["userSecrets"] as const,
  specificUserSecrets: ({
    offset,
    limit,
    secretType,
    search
  }: {
    offset: number;
    limit: number;
    secretType?: UserSecretType | null;
    search?: string;
  }) => [...userSecretKeys.allUserSecrets(), { offset, limit, secretType, search }] as const
};

export const useGetUserSecrets = ({
  offset = 0,
  limit = 25,
  secretType,
  search
}: {
  offset: number;
  limit: number;
  secretType?: UserSecretType | null;
  search?: string;
}) => {
  return useQuery({
    queryKey: userSecretKeys.specificUserSecrets({ offset, limit, secretType, search }),
    queryFn: async () => {
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(limit),
        secretType: String(secretType),
        search: String(search)
      });
      if (!secretType) {
        params.delete("secretType");
      }
      if (!search) {
        params.delete("search");
      }

      const { data } = await apiRequest.get<{ secrets: TUserSecret[]; totalCount: number }>(
        "/api/v1/user-secrets",
        {
          params
        }
      );
      return data;
    }
  });
};
