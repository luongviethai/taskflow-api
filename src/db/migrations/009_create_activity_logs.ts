import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("activity_logs", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("workspace_id").notNullable();
    table.uuid("user_id").notNullable();

    // entity_type + entity_id = "polymorphic reference"
    // Thay vì tạo riêng task_logs, project_logs, workspace_logs...
    // Dùng 1 bảng chung, phân biệt bằng entity_type
    table.string("entity_type", 20).notNullable(); // 'task', 'project', 'comment', 'workspace'
    table.uuid("entity_id").notNullable(); // ID của entity đó

    // action: 'created', 'updated', 'deleted', 'assigned', 'status_changed'
    table.string("action", 30).notNullable();

    // metadata: JSON chứa chi tiết thay đổi
    // Ví dụ: { "field": "status", "old": "todo", "new": "in_progress" }
    // Dùng jsonb (không phải json) — jsonb cho phép index và query nhanh hơn
    table.jsonb("metadata").defaultTo("{}");

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    // Foreign keys
    table
      .foreign("workspace_id")
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    // KHÔNG có FK cho entity_id — vì entity_type có thể là 'task', 'project', v.v.
    // PostgreSQL không hỗ trợ "conditional foreign key"

    // INDEX — bảng này sẽ LỚN NHẤT (10M+ row)
    // Query phổ biến: "activity gần đây của workspace"
    table.index(["workspace_id", "created_at"]);

    // Query: "history của 1 entity cụ thể" (vd: xem lịch sử 1 task)
    table.index(["entity_type", "entity_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("activity_logs");
}
