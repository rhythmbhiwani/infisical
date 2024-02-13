/* eslint-disable @typescript-eslint/no-redeclare */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { ForbiddenError } from "@casl/ability";
import slugify from "@sindresorhus/slugify";

import { ProjectMembershipRole, ProjectVersion } from "@app/db/schemas";
import { TLicenseServiceFactory } from "@app/ee/services/license/license-service";
import { OrgPermissionActions, OrgPermissionSubjects } from "@app/ee/services/permission/org-permission";
import { TPermissionServiceFactory } from "@app/ee/services/permission/permission-service";
import { ProjectPermissionActions, ProjectPermissionSub } from "@app/ee/services/permission/project-permission";
import { isAtLeastAsPrivileged } from "@app/lib/casl";
import { getConfig } from "@app/lib/config/env";
import { createSecretBlindIndex } from "@app/lib/crypto";
import { infisicalSymmetricEncypt } from "@app/lib/crypto/encryption";
import { BadRequestError, ForbiddenRequestError } from "@app/lib/errors";
import { alphaNumericNanoId } from "@app/lib/nanoid";
import { createProjectKey, createWsMembers } from "@app/lib/project";
import { TProjectPermission } from "@app/lib/types";

import { ActorType } from "../auth/auth-type";
import { TIdentityOrgDALFactory } from "../identity/identity-org-dal";
import { TIdentityProjectDALFactory } from "../identity-project/identity-project-dal";
import { TOrgServiceFactory } from "../org/org-service";
import { TProjectBotDALFactory } from "../project-bot/project-bot-dal";
import { TProjectEnvDALFactory } from "../project-env/project-env-dal";
import { TProjectKeyDALFactory } from "../project-key/project-key-dal";
import { TProjectMembershipDALFactory } from "../project-membership/project-membership-dal";
import { TSecretBlindIndexDALFactory } from "../secret-blind-index/secret-blind-index-dal";
import { ROOT_FOLDER_NAME, TSecretFolderDALFactory } from "../secret-folder/secret-folder-dal";
import { TUserDALFactory } from "../user/user-dal";
import { TProjectDALFactory } from "./project-dal";
import { TProjectQueueFactory } from "./project-queue";
import { TCreateProjectDTO, TDeleteProjectDTO, TGetProjectDTO, TUpgradeProjectDTO } from "./project-types";

export const DEFAULT_PROJECT_ENVS = [
  { name: "Development", slug: "dev" },
  { name: "Staging", slug: "staging" },
  { name: "Production", slug: "prod" }
];

type TProjectServiceFactoryDep = {
  projectDAL: TProjectDALFactory;
  projectQueue: TProjectQueueFactory;
  userDAL: TUserDALFactory;
  folderDAL: TSecretFolderDALFactory;
  projectEnvDAL: Pick<TProjectEnvDALFactory, "insertMany" | "find">;
  identityOrgMembershipDAL: TIdentityOrgDALFactory;
  identityProjectDAL: TIdentityProjectDALFactory;
  projectKeyDAL: Pick<TProjectKeyDALFactory, "create" | "findLatestProjectKey" | "delete" | "find" | "insertMany">;
  projectBotDAL: Pick<TProjectBotDALFactory, "create" | "findById" | "delete" | "findOne">;
  projectMembershipDAL: Pick<TProjectMembershipDALFactory, "create" | "findProjectGhostUser" | "findOne">;
  secretBlindIndexDAL: Pick<TSecretBlindIndexDALFactory, "create">;
  permissionService: TPermissionServiceFactory;
  orgService: Pick<TOrgServiceFactory, "addGhostUser">;
  licenseService: Pick<TLicenseServiceFactory, "getPlan">;
};

export type TProjectServiceFactory = ReturnType<typeof projectServiceFactory>;

export const projectServiceFactory = ({
  projectDAL,
  projectQueue,
  projectKeyDAL,
  permissionService,
  userDAL,
  folderDAL,
  orgService,
  identityProjectDAL,
  projectBotDAL,
  identityOrgMembershipDAL,
  secretBlindIndexDAL,
  projectMembershipDAL,
  projectEnvDAL,
  licenseService
}: TProjectServiceFactoryDep) => {
  /*
   * Create workspace. Make user the admin
   * */
  const createProject = async ({ orgId, actor, actorId, actorOrgId, workspaceName }: TCreateProjectDTO) => {
    const { permission, membership: orgMembership } = await permissionService.getOrgPermission(
      actor,
      actorId,
      orgId,
      actorOrgId
    );
    ForbiddenError.from(permission).throwUnlessCan(OrgPermissionActions.Create, OrgPermissionSubjects.Workspace);

    const appCfg = getConfig();
    const blindIndex = createSecretBlindIndex(appCfg.ROOT_ENCRYPTION_KEY, appCfg.ENCRYPTION_KEY);

    const plan = await licenseService.getPlan(orgId);
    if (plan.workspaceLimit !== null && plan.workspacesUsed >= plan.workspaceLimit) {
      // case: limit imposed on number of workspaces allowed
      // case: number of workspaces used exceeds the number of workspaces allowed
      throw new BadRequestError({
        message: "Failed to create workspace due to plan limit reached. Upgrade plan to add more workspaces."
      });
    }

    const results = await projectDAL.transaction(async (tx) => {
      const ghostUser = await orgService.addGhostUser(orgId, tx);

      const project = await projectDAL.create(
        {
          name: workspaceName,
          orgId,
          slug: slugify(`${workspaceName}-${alphaNumericNanoId(4)}`),
          version: ProjectVersion.V2
        },
        tx
      );
      // set ghost user as admin of project
      await projectMembershipDAL.create(
        {
          userId: ghostUser.user.id,
          role: ProjectMembershipRole.Admin,
          projectId: project.id
        },
        tx
      );

      // generate the blind index for project
      await secretBlindIndexDAL.create(
        {
          projectId: project.id,
          keyEncoding: blindIndex.keyEncoding,
          saltIV: blindIndex.iv,
          saltTag: blindIndex.tag,
          algorithm: blindIndex.algorithm,
          encryptedSaltCipherText: blindIndex.ciphertext
        },
        tx
      );
      // set default environments and root folder for provided environments
      const envs = await projectEnvDAL.insertMany(
        DEFAULT_PROJECT_ENVS.map((el, i) => ({ ...el, projectId: project.id, position: i + 1 })),
        tx
      );
      await folderDAL.insertMany(
        envs.map(({ id }) => ({ name: ROOT_FOLDER_NAME, envId: id, version: 1 })),
        tx
      );

      // 3. Create a random key that we'll use as the project key.
      const { key: encryptedProjectKey, iv: encryptedProjectKeyIv } = createProjectKey({
        publicKey: ghostUser.keys.publicKey,
        privateKey: ghostUser.keys.plainPrivateKey
      });

      // 4. Save the project key for the ghost user.
      await projectKeyDAL.create(
        {
          projectId: project.id,
          receiverId: ghostUser.user.id,
          encryptedKey: encryptedProjectKey,
          nonce: encryptedProjectKeyIv,
          senderId: ghostUser.user.id
        },
        tx
      );

      const { iv, tag, ciphertext, encoding, algorithm } = infisicalSymmetricEncypt(ghostUser.keys.plainPrivateKey);

      // 5. Create & a bot for the project
      await projectBotDAL.create(
        {
          name: "Infisical Bot (Ghost)",
          projectId: project.id,
          tag,
          iv,
          encryptedProjectKey,
          encryptedProjectKeyNonce: encryptedProjectKeyIv,
          encryptedPrivateKey: ciphertext,
          isActive: true,
          publicKey: ghostUser.keys.publicKey,
          senderId: ghostUser.user.id,
          algorithm,
          keyEncoding: encoding
        },
        tx
      );

      // Find the ghost users latest key
      const latestKey = await projectKeyDAL.findLatestProjectKey(ghostUser.user.id, project.id, tx);

      if (!latestKey) {
        throw new Error("Latest key not found for user");
      }

      // If the project is being created by a user, add the user to the project as an admin
      if (actor === ActorType.USER) {
        // Find public key of user
        const user = await userDAL.findUserEncKeyByUserId(actorId);

        if (!user) {
          throw new Error("User not found");
        }

        const [projectAdmin] = createWsMembers({
          decryptKey: latestKey,
          userPrivateKey: ghostUser.keys.plainPrivateKey,
          members: [
            {
              userPublicKey: user.publicKey,
              orgMembershipId: orgMembership.id,
              projectMembershipRole: ProjectMembershipRole.Admin
            }
          ]
        });

        // Create a membership for the user
        await projectMembershipDAL.create(
          {
            projectId: project.id,
            userId: user.id,
            role: projectAdmin.projectRole
          },
          tx
        );

        // Create a project key for the user
        await projectKeyDAL.create(
          {
            encryptedKey: projectAdmin.workspaceEncryptedKey,
            nonce: projectAdmin.workspaceEncryptedNonce,
            senderId: ghostUser.user.id,
            receiverId: user.id,
            projectId: project.id
          },
          tx
        );
      }

      // If the project is being created by an identity, add the identity to the project as an admin
      else if (actor === ActorType.IDENTITY) {
        // Find identity org membership
        const identityOrgMembership = await identityOrgMembershipDAL.findOne(
          {
            identityId: actorId,
            orgId: project.orgId
          },
          tx
        );

        // If identity org membership not found, throw error
        if (!identityOrgMembership) {
          throw new BadRequestError({
            message: `Failed to find identity with id ${actorId}`
          });
        }

        // Get the role permission for the identity
        // IS THIS CORRECT?
        const { permission: rolePermission, role: customRole } = await permissionService.getOrgPermissionByRole(
          ProjectMembershipRole.Admin,
          orgId
        );

        const hasPrivilege = isAtLeastAsPrivileged(permission, rolePermission);
        if (!hasPrivilege)
          throw new ForbiddenRequestError({
            message: "Failed to add identity to project with more privileged role"
          });
        const isCustomRole = Boolean(customRole);

        await identityProjectDAL.create(
          {
            identityId: actorId,
            projectId: project.id,
            role: isCustomRole ? ProjectMembershipRole.Custom : ProjectMembershipRole.Admin,
            roleId: customRole?.id
          },
          tx
        );
      }

      return {
        ...project,
        environments: envs,
        _id: project.id
      };
    });

    return results;
  };

  const findProjectGhostUser = async (projectId: string) => {
    const user = await projectMembershipDAL.findProjectGhostUser(projectId);

    return user;
  };

  const deleteProject = async ({ actor, actorId, actorOrgId, projectId }: TDeleteProjectDTO) => {
    const { permission } = await permissionService.getProjectPermission(actor, actorId, projectId, actorOrgId);
    ForbiddenError.from(permission).throwUnlessCan(ProjectPermissionActions.Delete, ProjectPermissionSub.Project);

    const deletedProject = await projectDAL.deleteById(projectId);
    return deletedProject;
  };

  const getProjects = async (actorId: string) => {
    const workspaces = await projectDAL.findAllProjects(actorId);
    return workspaces;
  };

  const getAProject = async ({ actorId, actorOrgId, projectId, actor }: TGetProjectDTO) => {
    await permissionService.getProjectPermission(actor, actorId, projectId, actorOrgId);
    return projectDAL.findProjectById(projectId);
  };

  const toggleAutoCapitalization = async ({
    projectId,
    actor,
    actorId,
    actorOrgId,
    autoCapitalization
  }: TGetProjectDTO & { autoCapitalization: boolean }) => {
    const { permission } = await permissionService.getProjectPermission(actor, actorId, projectId, actorOrgId);
    ForbiddenError.from(permission).throwUnlessCan(ProjectPermissionActions.Edit, ProjectPermissionSub.Settings);

    const updatedProject = await projectDAL.updateById(projectId, { autoCapitalization });
    return updatedProject;
  };

  const updateName = async ({ projectId, actor, actorId, actorOrgId, name }: TGetProjectDTO & { name: string }) => {
    const { permission } = await permissionService.getProjectPermission(actor, actorId, projectId, actorOrgId);
    ForbiddenError.from(permission).throwUnlessCan(ProjectPermissionActions.Edit, ProjectPermissionSub.Settings);

    const updatedProject = await projectDAL.updateById(projectId, { name });
    return updatedProject;
  };

  const upgradeProject = async ({ projectId, actor, actorId, userPrivateKey }: TUpgradeProjectDTO) => {
    const { permission, membership } = await permissionService.getProjectPermission(actor, actorId, projectId);

    ForbiddenError.from(permission).throwUnlessCan(ProjectPermissionActions.Delete, ProjectPermissionSub.Project);

    if (membership?.role !== ProjectMembershipRole.Admin) {
      throw new ForbiddenRequestError({
        message: "User must be admin"
      });
    }

    /*
    1. Get the existing project 
    2. Get the existing project keys
    4. Get all the project envs & folders
    5. Get ALL secrets within the project
    6. Create a new ghost user
    7. Create a project membership for the ghost user
    8. Get the existing bot, and the existing project keys for the members of the project
    9. IF a bot already exists for the project, delete it!
    10. Delete all the existing project keys
    11. Create a project key for the ghost user
    12. Find the newly created ghost user's latest key
    

    FOR EACH OF THE OLD PROJECT KEYS (loop):
    	13. Find the user based on the key.receiverId.
    	14. Find the org membership for the user.
    	15. Create a new project key for the user.
    

		16. Encrypt the ghost user's private key
		17. Create a new bot, and set the public/private key of the bot, to the ghost user's public/private key.
		18. Add the workspace key to the bot
		19. Decrypt the secrets with the old project key
		20. Get the newly created bot's private key, and workspace key (we do it this way to test as many steps of the bot process as possible)
		21. Get the workspace key from the bot


		FOR EACH DECRYPTED SECRET (loop):
			22. Re-encrypt the secret value, secret key, and secret comment with the NEW project key from the bot.
			23. Update the secret in the database with the new encrypted values.
   
		
		24. Transaction ends. If there were no errors. All changes are applied.
		25. API route returns 200 OK.
		*/

    const encryptedPrivateKey = infisicalSymmetricEncypt(userPrivateKey);

    await projectQueue.upgradeProject({
      projectId,
      startedByUserId: actorId,
      encryptedPrivateKey: {
        encryptedKey: encryptedPrivateKey.ciphertext,
        encryptedKeyIv: encryptedPrivateKey.iv,
        encryptedKeyTag: encryptedPrivateKey.tag,
        keyEncoding: encryptedPrivateKey.encoding
      }
    });
  };

  const getProjectUpgradeStatus = async ({ projectId, actor, actorId }: TProjectPermission) => {
    const { permission } = await permissionService.getProjectPermission(actor, actorId, projectId);
    ForbiddenError.from(permission).throwUnlessCan(ProjectPermissionActions.Read, ProjectPermissionSub.Secrets);

    const project = await projectDAL.findProjectById(projectId);

    if (!project) {
      throw new BadRequestError({
        message: `Project with id ${projectId} not found`
      });
    }

    return project.upgradeStatus || null;
  };

  return {
    createProject,
    deleteProject,
    getProjects,
    findProjectGhostUser,
    getProjectUpgradeStatus,
    getAProject,
    toggleAutoCapitalization,
    updateName,
    upgradeProject
  };
};
