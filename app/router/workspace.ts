import { KindeOrganization, KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { base } from "../middlewares/base";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { requiredWorkspaceMiddleware } from "../middlewares/workspace";
import { workspaceScheme } from "../schemas/workspace";
import { init, Organizations } from "@kinde/management-api-js";
import { z } from "zod";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write";

// ---------------- LIST WORKSPACES ----------------

export const listWorkspaces = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .route({
    method: "GET",
    path: "/workspace",
    summary: "List all workspaces",
    tags: ["workspace"],
  })
  .input(z.void())
  .output(
    z.object({
      workspaces: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          avatar: z.string(),
        })
      ),
      user: z.custom<KindeUser<Record<string, unknown>>>(),
      currentWorkspace: z.custom<KindeOrganization<unknown>>(),
    })
  )
  .handler(async ({ context, errors }) => {
    const { getUserOrganizations } = getKindeServerSession();

    let organizations;
    try {
      organizations = await getUserOrganizations();
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
      throw errors.FORBIDDEN({ message: "Cannot fetch workspaces" });
    }

    if (!organizations) {
      console.warn("No organizations returned in ID token.");
      throw errors.FORBIDDEN({ message: "No organizations found" });
    }

    return {
      workspaces: organizations.orgs.map((org) => ({
        id: org.code,
        name: org.name ?? "My Workspace",
        avatar: org.name?.charAt(0) ?? "M",
      })),
      user: context.user,
      currentWorkspace: context.workspace,
    };
  });

// ---------------- CREATE WORKSPACE ----------------

export const createWorkspace = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/workspace",
    summary: "Create a new workspace",
    tags: ["workspace"],
  })
  .input(workspaceScheme)
  .output(
    z.object({
      orgCode: z.string(),
      workspaceName: z.string(),
    })
  )
  .handler(async ({ context, errors, input }) => {
    init();

    let data;
    try {
      data = await Organizations.createOrganization({
        requestBody: { name: input.name },
      });
    } catch (err) {
      console.error("Failed to create organization:", err);
      throw errors.FORBIDDEN({ message: "Cannot create workspace" });
    }

    if (!data.organization?.code) {
      throw errors.FORBIDDEN({ message: "Org code is not defined" });
    }

    try {
      await Organizations.addOrganizationUsers({
        orgCode: data.organization.code,
        requestBody: {
          users: [{ id: context.user.id, roles: ["admin"] }],
        },
      });
    } catch (err) {
      console.error("Failed to add user to organization:", err);
      throw errors.FORBIDDEN({ message: "Cannot add user to workspace" });
    }

    const { refreshTokens } = getKindeServerSession();
    await refreshTokens();

    return {
      orgCode: data.organization.code,
      workspaceName: input.name,
    };
  });
