import { Knex } from 'knex';

// ============================================================
// MIGRATION: workspace_members (bảng nối)
// ============================================================
// Đây là bảng thể hiện quan hệ MANY-TO-MANY:
//   1 user → thuộc nhiều workspace
//   1 workspace → có nhiều user
//
// Bảng nối (junction table / join table) là pattern chuẩn
// cho many-to-many trong relational database.
// ============================================================

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('workspace_members', (table) => {
    table
      .uuid('workspace_id')
      .notNullable()
      .references('id')
      .inTable('workspaces')
      .onDelete('CASCADE');
    // CASCADE: xóa workspace → tự xóa membership record.
    // Hợp lý vì membership không có ý nghĩa nếu workspace không còn.


    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    // CASCADE: xóa user → tự xóa membership.
    // Workspace vẫn tồn tại, chỉ mất 1 member.

    // Role: owner | member | viewer
    // CHECK constraint: DB reject giá trị ngoài 3 cái này.
    // → Không cần validate ở app layer cho field này (nhưng vẫn nên).
    table.string('role', 20).notNullable().defaultTo('member');

    // PRIMARY KEY: composite key (workspace_id, user_id)
    // → 1 user chỉ thuộc 1 workspace 1 lần.
    // → Nếu insert trùng cặp (workspace_id, user_id) → DB reject.
    table.primary(['workspace_id', 'user_id']);

    table.timestamp('joined_at').defaultTo(knex.fn.now()).notNullable();
  });

  // Knex không hỗ trợ CHECK constraint trực tiếp trong schema builder,
  // nên thêm bằng raw SQL. Tháng 2 sẽ viết nhiều raw SQL hơn.
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('workspace_members');
}
