import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tasks", (table) => {
    table.timestamp("deadline").nullable();
    // nullable vì không phải task nào cũng có deadline
    // Sẽ thêm index ở tuần 2 khi làm thí nghiệm
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tasks", (table) => {
    table.dropColumn("deadline");
  });
}
