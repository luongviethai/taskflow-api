import { Knex } from "knex";

// ============================================================
// MIGRATION: projects
// ============================================================
// Project thuộc 1 workspace. Mỗi workspace có nhiều project.
// Đây là quan hệ ONE-TO-MANY đơn giản.
// ============================================================

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("projects", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table
      .uuid("workspace_id")
      .notNullable()
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");
    // CASCADE: xóa workspace → xóa tất cả project của workspace đó.
    // Project không có ý nghĩa nếu workspace không còn.

    table.string("name", 200).notNullable();
    table.text("description");
    // text: không giới hạn độ dài (khác varchar có limit).
    // Dùng cho field có thể dài: description, content, bio...

    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("projects");
}
