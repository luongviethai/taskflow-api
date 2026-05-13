import { Knex } from "knex";

async function checkProjectAccess(db: Knex, projectId: number, userId: number) {
  const project = await db("projects").where({ id: projectId }).first();

  if (!project) {
    return { allowed: false, project: null };
  }

  const membership = await db("workspace_members")
    .where({
      workspace_id: project.workspace_id,
      user_id: userId,
    })
    .first();

  if (!membership) return { allowed: false, project: null };

  return { allowed: true, project, membership };
}

async function checkTaskAccess(db: Knex, taskId: number, userId: number) {
  const task = await db("tasks").where({ id: taskId }).first();
  if (!task) return { allowed: false, task: null };

  const projectAccess = await checkProjectAccess(db, task.project_id, userId);
  if (!projectAccess.allowed) return { allowed: false, task: null };

  return {
    allowed: true,
    task,
    project: projectAccess.project,
    membership: projectAccess.membership,
  };
}

export { checkProjectAccess, checkTaskAccess };
