import { Knex } from "knex";
import db from "../db";

interface LogActivityParams {
  workspaceId: string;
  userId: string;
  action: "created" | "updated" | "deleted";
  entityType: "task" | "project" | "comment" | "label";
  entityId: string;
  metadata?: Record<string, any>;
}

export const logActivity = async (
  params: LogActivityParams,
  trx?: Knex.Transaction,
) => {
  const query = trx || db;

  await query("activity_logs").insert({
    id: crypto.randomUUID(),
    workspace_id: params.workspaceId,
    user_id: params.userId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    metadata: JSON.stringify(params.metadata || {}),
    created_at: new Date(),
  });
};
