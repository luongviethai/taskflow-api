import { Knex } from "knex";

// ============================================================
// MIGRATION: users
// ============================================================
// Bảng đầu tiên — không phụ thuộc bảng nào khác.
// Mọi bảng sau đều reference đến users qua foreign key.
// ============================================================

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("users", (table) => {
    // id: auto-increment, đơn giản cho giai đoạn này.
    // Tháng sau sẽ cân nhắc UUID nếu cần.
    table.increments("id").primary();

    table.string("email", 255).notNullable().unique();
    // UNIQUE constraint: DB sẽ reject nếu insert email trùng.
    // Đây là "defense in depth" — app cũng check, nhưng DB là hàng rào cuối cùng.

    table.string("password_hash", 255).notNullable();
    // Lưu bcrypt hash, KHÔNG BAO GIỜ lưu password gốc.
    // Tên cột là "password_hash" (không phải "password") để
    // nhắc nhở: đây KHÔNG phải password thật.

    table.string("name", 100).notNullable();

    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
    // defaultTo(knex.fn.now()): DB tự điền thời gian hiện tại khi insert.
    // Không cần app truyền vào → ít lỗi hơn, thời gian chính xác hơn.
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("users");
}
