import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("comments", (table) => {
    // Primary key — dùng UUID, không dùng auto-increment
    // UUID tốt cho distributed system, không cần DB để generate ID
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // Foreign keys
    table.uuid("task_id").notNullable();
    table.uuid("user_id").notNullable();

    // Content — dùng text thay vì varchar
    // text trong PostgreSQL không có giới hạn length và performance giống varchar
    table.text("content").notNullable();

    // Timestamp
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    // Foreign key constraints
    // onDelete('CASCADE') — khi xóa task, tự động xóa comment
    // Tại sao CASCADE? Vì comment không có ý nghĩa nếu task bị xóa
    table
      .foreign("task_id")
      .references("id")
      .inTable("tasks")
      .onDelete("CASCADE");
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    // INDEX — quan trọng!
    // Query phổ biến nhất: "lấy tất cả comment của 1 task"
    // → SELECT * FROM comments WHERE task_id = ? ORDER BY created_at DESC
    // Không có index → Seq Scan toàn bộ bảng comments (sẽ có 5 triệu row!)
    table.index("task_id");

    // Index thứ 2: "tất cả comment của 1 user" (ít dùng hơn, nhưng cần cho profile)
    table.index("user_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("comments");
}
