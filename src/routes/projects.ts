import { Request, Response, Router } from "express";
import db from "../db";
import { checkProjectAccess } from "./helpers";

const router = Router();

router.post("/:id/tasks", async (req: Request, res: Response) => {
  try {
    let projectId: number;
    const userId = req.user?.id;
    const { title, description, status, assignee_id } = req.body;

    if (typeof req.params.id === "string") {
      projectId = parseInt(req.params.id);
    } else {
      projectId = parseInt(req.params.id[0]);
    }

    if (!projectId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const projectAccess = await checkProjectAccess(db, projectId, userId);

    if (!projectAccess.allowed) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (assignee_id) {
      const assigneeMember = await db("workspace_members")
        .where({
          workspace_id: projectAccess.project?.workspace_id,
          user_id: assignee_id,
        })
        .first();

      if (!assigneeMember) {
        return res.status(404).json({
          error: "User is not a member of the workspace",
        });
      }
    }

    const [task] = await db("tasks")
      .insert({
        project_id: projectId,
        title,
        description,
        status: status || "todo",
        assignee_id,
        created_at: new Date(),
      })
      .returning("*");

    res.status(201).json(task);
  } catch (error) {
    console.error("Error listing workspaces:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/tasks", async (req: Request, res: Response) => {
  try {
    let projectId: number;
    const userId = req.user?.id;

    if (typeof req.params.id === "string") {
      projectId = parseInt(req.params.id);
    } else {
      projectId = parseInt(req.params.id[0]);
    }

    if (!projectId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const projectAccess = await checkProjectAccess(db, projectId, userId);

    if (!projectAccess.allowed) {
      return res.status(404).json({ error: "Project not found" });
    }

    const query = db("tasks")
      .where({ project_id: projectId })
      .orderBy("created_at", "desc");

    const tasks = await query.limit(100);

    res.json(tasks);
  } catch (error) {
    console.error("Error listing workspaces:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/tasks", async (req: Request, res: Response) => {});

router.delete("/tasks/:id", async (req: Request, res: Response) => {
  try {
    let taskId: number;

    if (typeof req.params.id === "string") {
      taskId = parseInt(req.params.id);
    } else {
      taskId = parseInt(req.params.id[0]);
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error listing workspaces:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as projectsRouter };
