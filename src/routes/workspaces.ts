import { Request, Response, Router } from "express";
import db from "../db";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const workspace = await db.transaction(async (tx) => {
      const [newWorkspace] = await tx("workspaces")
        .insert({
          name,
          owner_id: userId,
          created_at: new Date(),
        })
        .returning("*");

      await tx("workspace_members").insert({
        workspace_id: newWorkspace.id,
        user_id: userId,
        role: "owner",
        joined_at: new Date(),
      });

      return newWorkspace;
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error("Error listing workspaces:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const workspaces = await db("workspaces")
      .join(
        "workspace_members",
        "workspaces.id",
        "workspace_members.workspace_id",
      )
      .where("workspace_members.user_id", userId)
      .select("workspaces.*", "workspace_members.role as my_role");

    res.json(workspaces);
  } catch (error) {
    console.error("Error listing workspaces:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/members", async (req: Request, res: Response) => {
  try {
    let workspaceId: number;

    if (typeof req.params.id === "string") {
      workspaceId = parseInt(req.params.id);
    } else {
      workspaceId = parseInt(req.params.id[0]);
    }

    const { user_id: newMemberId, role } = req.body;

    const currentUserId = req.user?.id;

    const workspace = await db("workspaces")
      .where({
        id: workspaceId,
      })
      .first();

    if (!workspace) {
      res.status(404).json({ error: "Workspace not found" });
    }

    const currentMember = await db("workspace_members")
      .where({
        workspace_id: workspaceId,
        user_id: currentUserId,
      })
      .first();

    if (!currentMember || currentMember.role !== "owner") {
      res.status(403).json({ error: "Only workspace owner can add members" });
    }

    const targetUser = await db("users")
      .where({
        id: newMemberId,
      })
      .first();

    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
    }

    const existingMember = await db("workspace_members")
      .where({
        workspace_id: workspaceId,
        user_id: newMemberId,
      })
      .first();

    if (existingMember) {
      res.status(400).json({ error: "User is already a member" });
    }

    await db("workspace_members").insert({
      workspace_id: workspaceId,
      user_id: newMemberId,
      role,
    });

    res.status(201).json({
      message: "Member added successfully",
      workspace_id: workspaceId,
      user_id: newMemberId,
      role,
    });
  } catch (error) {
    console.error("Error listing workspaces:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/projects", async (req: Request, res: Response) => {
  try {
    let workspaceId: number;
    const userId = req.user?.id;
    const { name, description } = req.body;

    if (typeof req.params.id === "string") {
      workspaceId = parseInt(req.params.id);
    } else {
      workspaceId = parseInt(req.params.id[0]);
    }

    const workspace = await db("workspaces")
      .where({
        id: workspaceId,
      })
      .first();

    if (!workspace) {
      res.status(404).json({ error: "Workspace not found" });
    }

    const memberShip = await db("workspace_members").where({
      workspace_id: workspaceId,
      user_id: userId,
    });

    if (!memberShip) {
      res.status(404).json({ error: "Workspace not found" });
    }

    const [project] = await db("projects")
      .insert({
        workspace_id: workspaceId,
        name,
        description,
        created_at: new Date(),
      })
      .returning("*");

    res.status(201).json(project);
  } catch (error) {
    console.error("Error listing workspaces:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/projects", async (req: Request, res: Response) => {
  try {
    let workspaceId: number;
    const userId = req.user?.id;

    if (typeof req.params.id === "string") {
      workspaceId = parseInt(req.params.id);
    } else {
      workspaceId = parseInt(req.params.id[0]);
    }

    const membership = await db("workspace_members")
      .where({
        workspace_id: workspaceId,
        user_id: userId,
      })
      .first();

    if (!membership) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const projects = await db("projects")
      .where({
        workspace_id: workspaceId,
      })
      .orderBy("created_at", "desc");

    res.json(projects);
  } catch (error) {
    console.error("Error listing workspaces:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as wordspacesRouter };
