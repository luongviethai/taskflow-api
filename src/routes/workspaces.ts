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
  } catch (error) {}
});

router.get("/", async (req: Request, res: Response) => {});

export { router as wordspacesRouter };
