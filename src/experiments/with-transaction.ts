import db from "../db";

async function createTaskWithTransaction() {
  console.log("=== THÍ NGHIỆM 2: CÓ TRANSACTION ===\n");

  // Đếm TRƯỚC
  const taskCountBefore = await db("tasks").count("id as count").first();
  const logCountBefore = await db("activity_logs").count("id as count").first();
  console.log(
    `TRƯỚC: tasks = ${taskCountBefore?.count}, logs = ${logCountBefore?.count}`,
  );

  // Bắt đầu transaction
  const trx = await db.transaction();

  try {
    // Bước 1: Insert task — trong transaction
    const [task] = await trx("tasks")
      .insert({
        project_id: "ID_CỦA_1_PROJECT_CÓ_THẬT", // ← thay bằng ID thật
        title: "Task thí nghiệm - có transaction",
        description: "Task này dùng để test transaction",
        status: "todo",
        created_at: new Date(),
      })
      .returning("*");

    console.log(
      `✅ Task insert thành công (trong transaction): id = ${task.id}`,
    );

    // Kiểm tra: task có thấy được từ BÊN NGOÀI transaction không?
    const outsideCheck = await db("tasks").where({ id: task.id }).first();
    console.log(
      `👀 Nhìn từ bên ngoài transaction: ${outsideCheck ? "THẤY" : "KHÔNG THẤY"}`,
    );
    // ↑ Với Read Committed (default), bên ngoài KHÔNG thấy vì chưa commit

    // GIẢ LẬP LỖI — giống thí nghiệm 1
    throw new Error("💥 Lỗi giả lập!");

    // Bước 2: Ghi activity log — KHÔNG BAO GIỜ CHẠY ĐẾN ĐÂY
    await trx("activity_logs").insert({
      /* ... */
    });

    // Commit — KHÔNG BAO GIỜ CHẠY ĐẾN ĐÂY
    await trx.commit();
  } catch (error: any) {
    console.log(`\n❌ Lỗi xảy ra: ${error.message}`);
    console.log(`🔄 ROLLBACK — hủy toàn bộ thay đổi...`);
    await trx.rollback();
  }

  // Đếm SAU
  const taskCountAfter = await db("tasks").count("id as count").first();
  const logCountAfter = await db("activity_logs").count("id as count").first();
  console.log(
    `\nSAU:  tasks = ${taskCountAfter?.count}, logs = ${logCountAfter?.count}`,
  );

  const newTasks =
    Number(taskCountAfter?.count) - Number(taskCountBefore?.count);
  const newLogs = Number(logCountAfter?.count) - Number(logCountBefore?.count);

  console.log(`\n📊 KẾT QUẢ:`);
  console.log(`   Task mới:         +${newTasks}`);
  console.log(`   Activity log mới: +${newLogs}`);

  if (newTasks === 0 && newLogs === 0) {
    console.log(`\n🟢 HOÀN HẢO: Không có gì thay đổi!`);
    console.log(`   → Transaction đã ROLLBACK thành công`);
    console.log(`   → Task ở bước 1 cũng bị hủy`);
    console.log(`   → Database trở về đúng trạng thái ban đầu`);
    console.log(`   → ĐÂY LÀ ATOMICITY — "tất cả hoặc không gì cả"`);
  }
}

createTaskWithTransaction()
  .catch(console.error)
  .finally(() => db.destroy());
