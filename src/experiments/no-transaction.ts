import db from "../db";

async function createTaskNoTransaction() {
  console.log("=== THÍ NGHIỆM 1: KHÔNG CÓ TRANSACTION ===\n");

  const taskCountBefore = await db("tasks").count("id as count").first();
  const logCountBefore = await db("activity_logs").count("id as count").first();
  console.log(
    `TRƯỚC: tasks = ${taskCountBefore?.count}, logs = ${logCountBefore?.count}`,
  );

  try {
    // Bước 1: Insert task — SẼ THÀNH CÔNG
    const [task] = await db("tasks")
      .insert({
        // Điền đúng theo schema của bạn
        project_id: "9dc7945a-b546-4521-a193-30d8d78781bb", // ← thay bằng ID thật
        title: "Task thí nghiệm - không transaction",
        description: "Task này dùng để test",
        status: "todo",
        created_at: new Date(),
      })
      .returning("*");

    console.log(`✅ Task đã tạo: id = ${task.id}, title = "${task.title}"`);

    // GIẢ LẬP LỖI — tưởng tượng network timeout, bug code, v.v.
    throw new Error("💥 Lỗi giả lập! Database connection mất, hoặc bug code.");

    // Bước 2: Ghi activity log — SẼ KHÔNG BAO GIỜ CHẠY ĐẾN ĐÂY
    await db("activity_logs").insert({
      workspace_id: "xxx",
      user_id: "xxx",
      entity_type: "task",
      entity_id: task.id,
      action: "created",
      metadata: JSON.stringify({ title: task.title }),
      created_at: new Date(),
    });
  } catch (error: any) {
    console.log(`\n❌ Lỗi xảy ra: ${error.message}`);
  }

  const taskCountAfter = await db("tasks").count("id as count").first();
  const logCountAfter = await db("activity_logs").count("id as count").first();
  console.log(
    `\nSAU:  tasks = ${taskCountAfter?.count}, logs = ${logCountAfter?.count}`,
  );

  // So sánh
  const newTasks =
    Number(taskCountAfter?.count) - Number(taskCountBefore?.count);
  const newLogs = Number(logCountAfter?.count) - Number(logCountBefore?.count);

  console.log(`\n📊 KẾT QUẢ:`);
  console.log(`   Task mới:         +${newTasks}`);
  console.log(`   Activity log mới: +${newLogs}`);

  if (newTasks > 0 && newLogs === 0) {
    console.log(`\n🔴 VẤN ĐỀ: Task được tạo nhưng KHÔNG có activity log!`);
    console.log(`   → Data KHÔNG NHẤT QUÁN (inconsistent)`);
    console.log(
      `   → Trong production, bạn sẽ không biết task này được tạo bởi ai, khi nào`,
    );
    console.log(`   → Admin nhìn activity log sẽ không thấy task này`);
  }

  // Xóa task thí nghiệm
  await db("tasks")
    .where({ title: "Task thí nghiệm - không transaction" })
    .del();
}

createTaskNoTransaction()
  .catch(console.error)
  .finally(() => db.destroy());
