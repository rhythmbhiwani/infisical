import { z } from "zod";

import { readLimit, writeLimit } from "@app/server/config/rateLimiter";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { AuthMode } from "@app/services/auth/auth-type";
import { UserSecretType } from "@app/services/user-secrets/user-secrets-enums";
import { userSecretSchema, userSecretsResponseSchema } from "@app/services/user-secrets/user-secrets-schemas";

export const registerUserSecretsRouter = async (server: FastifyZodProvider) => {
  // Create User Secret
  server.route({
    method: "POST",
    url: "/",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      body: userSecretSchema,
      response: {
        200: z.object({
          id: z.string().uuid()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const userSecret = await req.server.services.userSecrets.createUserSecret({
        actorId: req.permission.id,
        orgId: req.permission.orgId,
        ...req.body
      });
      return { id: userSecret.id };
    }
  });

  // Update User Secret
  server.route({
    method: "PUT",
    url: "/:id",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      params: z.object({
        id: z.string().uuid("Invalid ID format")
      }),
      body: userSecretSchema,
      response: {
        200: z.object({
          id: z.string().uuid()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const secret = await req.server.services.userSecrets.updateUserSecret(req.params.id, {
        actorId: req.permission.id,
        orgId: req.permission.orgId,
        ...req.body
      });
      return { id: secret.id };
    }
  });

  // Get All User Secrets
  server.route({
    method: "GET",
    url: "/",
    config: {
      rateLimit: readLimit
    },
    schema: {
      querystring: z.object({
        offset: z.coerce.number().min(0).max(100).default(0),
        limit: z.coerce.number().min(1).max(100).default(25),
        secretType: z
          .enum([UserSecretType.WEB_LOGIN, UserSecretType.CREDIT_CARD, UserSecretType.SECURE_NOTE, UserSecretType.WIFI])
          .optional(),
        search: z.coerce.string().optional()
      }),
      response: {
        200: z.object({
          secrets: z.array(userSecretsResponseSchema),
          totalCount: z.number()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const { offset, limit, secretType, search } = req.query;
      const { secrets, count: totalCount } = await req.server.services.userSecrets.getAllUserSecrets(
        req.permission.id,
        {
          offset,
          limit,
          secretType,
          search
        }
      );
      return { secrets, totalCount };
    }
  });

  // Delete User Secret
  server.route({
    method: "DELETE",
    url: "/:id",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      params: z.object({
        id: z.string().uuid("Invalid ID format")
      }),
      response: {
        200: z.object({
          id: z.string().uuid()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const secret = await req.server.services.userSecrets.deleteUserSecret(req.params.id);
      return { id: secret.id };
    }
  });
};
