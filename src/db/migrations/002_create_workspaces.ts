import { Knex } from 'knex';

// ============================================================
// MIGRATION: workspaces
// ============================================================
// Workspace là đơn vị tổ chức cao nhất.
// Mỗi workspace có 1 owner (user tạo ra nó).
// ============================================================

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('workspaces', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();

    // owner_id: ai tạo workspace này
    // ON DELETE RESTRICT: không cho xóa user nếu user đó đang own workspace.
    // Tại sao RESTRICT thay vì CASCADE?
    // → Xóa user → xóa workspace → xóa project → xóa task = MẤT DATA của cả team.
    //   Quá nguy hiểm. Bắt buộc phải transfer ownership trước khi xóa user.
    table
      .integer('owner_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');

    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('workspaces');
}
