import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // === Bảng labels ===
  await knex.schema.createTable("labels", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("workspace_id").notNullable();
    table.string("name", 50).notNullable(); // tên label ngắn: "Bug", "Feature", "Urgent"
    table.string("color", 7).notNullable(); // hex color: "#FF5733"
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table
      .foreign("workspace_id")
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");

    // UNIQUE constraint: không cho 2 label trùng tên trong cùng 1 workspace
    // → workspace "Team A" không thể có 2 label "Bug"
    // → nhưng workspace "Team A" có "Bug" VÀ workspace "Team B" cũng có "Bug" là OK
    table.unique(["workspace_id", "name"]);
  });

  // === Bảng task_labels (bảng nối many-to-many) ===
  await knex.schema.createTable("task_labels", (table) => {
    table.uuid("task_id").notNullable();
    table.uuid("label_id").notNullable();

    // Composite primary key — cặp (task_id, label_id) là unique
    // → 1 task không thể được gán cùng 1 label 2 lần
    table.primary(["task_id", "label_id"]);

    table
      .foreign("task_id")
      .references("id")
      .inTable("tasks")
      .onDelete("CASCADE");
    table
      .foreign("label_id")
      .references("id")
      .inTable("labels")
      .onDelete("CASCADE");

    // Index ngược: tìm tất cả task có label X
    // Primary key đã tạo index cho (task_id, label_id)
    // Nhưng cần thêm index cho label_id riêng — tại sao?
    // Vì query "tìm tất cả task có label 'Bug'" cần tìm theo label_id
    // Composite PK (task_id, label_id) chỉ hỗ trợ tìm theo task_id (leftmost prefix rule!)
    table.index("label_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("task_labels");
  await knex.schema.dropTableIfExists("labels");
  // Phải drop task_labels TRƯỚC labels (vì task_labels có FK đến labels)
}
