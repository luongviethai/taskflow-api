import { Knex } from 'knex';

// ============================================================
// MIGRATION: tasks
// ============================================================
// Task là entity cốt lõi của TaskFlow.
// Thuộc 1 project, có thể được assign cho 1 user.
//
// Lưu ý thiết kế:
//   - assignee_id NULLABLE: task có thể chưa assign cho ai
//   - status chỉ nhận 3 giá trị: todo, in_progress, done
// ============================================================

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();

    table
      .integer('project_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');
    // CASCADE: xóa project → xóa tất cả task.

    table.string('title', 500).notNullable();
    table.text('description');

    // Status: chỉ 3 giá trị hợp lệ
    // Default 'todo': task mới tạo luôn ở trạng thái todo
    table.string('status', 20).notNullable().defaultTo('todo');

    // assignee_id: NULLABLE — task có thể chưa assign
    // ON DELETE SET NULL: nếu user bị xóa, task vẫn tồn tại
    // chỉ mất assignee. Hợp lý hơn CASCADE (mất task = mất data).
    table
      .integer('assignee_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');

    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
  });

  // CHECK constraint cho status — DB reject giá trị ngoài 3 cái này
  // Knex không hỗ trợ CHECK trong schema builder, dùng raw SQL
  await knex.raw(`
    ALTER TABLE tasks
    ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('todo', 'in_progress', 'done'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('tasks');
}
