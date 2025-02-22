import { z } from "zod";

import { OrgMembershipRole, OrgMembershipsSchema, OrgRolesSchema } from "@app/db/schemas";
import { readLimit, writeLimit } from "@app/server/config/rateLimiter";
import { slugSchema } from "@app/server/lib/schemas";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { AuthMode } from "@app/services/auth/auth-type";

export const registerOrgRoleRouter = async (server: FastifyZodProvider) => {
  server.route({
    method: "POST",
    url: "/:organizationId/roles",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      params: z.object({
        organizationId: z.string().trim()
      }),
      body: z.object({
        slug: slugSchema({ min: 1, max: 64 }).refine(
          (val) => !Object.values(OrgMembershipRole).includes(val as OrgMembershipRole),
          "Please choose a different slug, the slug you have entered is reserved"
        ),
        name: z.string().trim(),
        description: z.string().trim().nullish(),
        permissions: z.any().array()
      }),
      response: {
        200: z.object({
          role: OrgRolesSchema
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const role = await server.services.orgRole.createRole(
        req.permission.id,
        req.params.organizationId,
        req.body,
        req.permission.authMethod,
        req.permission.orgId
      );
      return { role };
    }
  });

  server.route({
    method: "GET",
    url: "/:organizationId/roles/:roleId",
    config: {
      rateLimit: readLimit
    },
    schema: {
      params: z.object({
        organizationId: z.string().trim(),
        roleId: z.string().trim()
      }),
      response: {
        200: z.object({
          role: OrgRolesSchema
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const role = await server.services.orgRole.getRole(
        req.permission.id,
        req.params.organizationId,
        req.params.roleId,
        req.permission.authMethod,
        req.permission.orgId
      );
      return { role };
    }
  });

  server.route({
    method: "PATCH",
    url: "/:organizationId/roles/:roleId",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      params: z.object({
        organizationId: z.string().trim(),
        roleId: z.string().trim()
      }),
      body: z.object({
        // TODO: Switch to slugSchema after verifying correct methods with Akhil - Omar 11/24
        slug: slugSchema({ min: 1, max: 64 })
          .refine(
            (val) => !Object.keys(OrgMembershipRole).includes(val),
            "Please choose a different slug, the slug you have entered is reserved."
          )
          .optional(),
        name: z.string().trim().optional(),
        description: z.string().trim().nullish(),
        permissions: z.any().array().optional()
      }),
      response: {
        200: z.object({
          role: OrgRolesSchema
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const role = await server.services.orgRole.updateRole(
        req.permission.id,
        req.params.organizationId,
        req.params.roleId,
        req.body,
        req.permission.authMethod,
        req.permission.orgId
      );
      return { role };
    }
  });

  server.route({
    method: "DELETE",
    url: "/:organizationId/roles/:roleId",
    config: {
      rateLimit: writeLimit
    },
    schema: {
      params: z.object({
        organizationId: z.string().trim(),
        roleId: z.string().trim()
      }),
      response: {
        200: z.object({
          role: OrgRolesSchema
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const role = await server.services.orgRole.deleteRole(
        req.permission.id,
        req.params.organizationId,
        req.params.roleId,
        req.permission.authMethod,
        req.permission.orgId
      );
      return { role };
    }
  });

  server.route({
    method: "GET",
    url: "/:organizationId/roles",
    config: {
      rateLimit: readLimit
    },
    schema: {
      params: z.object({
        organizationId: z.string().trim()
      }),
      response: {
        200: z.object({
          data: z.object({
            roles: OrgRolesSchema.omit({ permissions: true })
              .merge(z.object({ permissions: z.unknown() }))
              .array()
          })
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const roles = await server.services.orgRole.listRoles(
        req.permission.id,
        req.params.organizationId,
        req.permission.authMethod,
        req.permission.orgId
      );
      return { data: { roles } };
    }
  });

  server.route({
    method: "GET",
    url: "/:organizationId/permissions",
    config: {
      rateLimit: readLimit
    },
    schema: {
      params: z.object({
        organizationId: z.string().trim()
      }),
      response: {
        200: z.object({
          membership: OrgMembershipsSchema,
          permissions: z.any().array()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const { permissions, membership } = await server.services.orgRole.getUserPermission(
        req.permission.id,
        req.params.organizationId,
        req.permission.authMethod,
        req.permission.orgId
      );
      return { permissions, membership };
    }
  });
};
