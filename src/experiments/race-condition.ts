import db from "../db";

async function simulateRaceCondition() {
  console.log("=== THÍ NGHIỆM 3: RACE CONDITION ===\n");

  // Bước 1: Tạo 1 task để test
  const [task] = await db("tasks")
    .insert({
      project_id: "9dc7945a-b546-4521-a193-30d8d78781bb", // ← thay bằng ID thật
      title: "Race condition test",
      status: "todo",
      created_at: new Date(),
    })
    .returning("*");

  console.log(`📝 Tạo task: id=${task.id}, status='todo'\n`);

  // Bước 2: Giả lập 2 user đồng thời

  const userA = async () => {
    // User A: Đọc task
    const t = await db("tasks").where({ id: task.id }).first();
    console.log(`[User A] 👀 Đọc task → status = '${t.status}'`);

    // User A: Suy nghĩ 1 giây rồi mới update
    // (Giả lập thời gian user click, hoặc code xử lý logic)
    console.log(`[User A] 🤔 Đang xử lý... (đợi 1 giây)`);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // User A: Update thành 'in_progress'
    await db("tasks").where({ id: task.id }).update({ status: "in_progress" });
    console.log(`[User A] ✏️  Update status → 'in_progress'`);
  };

  const userB = async () => {
    // User B: Đọc task (gần như cùng lúc với A)
    const t = await db("tasks").where({ id: task.id }).first();
    console.log(`[User B] 👀 Đọc task → status = '${t.status}'`);

    // User B: Suy nghĩ 500ms rồi update (nhanh hơn A)
    console.log(`[User B] 🤔 Đang xử lý... (đợi 500ms)`);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // User B: Update thành 'done'
    await db("tasks").where({ id: task.id }).update({ status: "done" });
    console.log(`[User B] ✏️  Update status → 'done'`);
  };

  // Bước 3: Chạy 2 user ĐỒNG THỜI
  console.log("🏁 Bắt đầu chạy đồng thời...\n");
  await Promise.all([userA(), userB()]);

  // Bước 4: Kiểm tra kết quả
  const finalTask = await db("tasks").where({ id: task.id }).first();
  console.log(`\n${"═".repeat(50)}`);
  console.log(`📊 KẾT QUẢ CUỐI CÙNG: status = '${finalTask.status}'`);
  console.log(`${"═".repeat(50)}`);

  // Phân tích
  console.log(`\n📋 PHÂN TÍCH:`);
  console.log(`   1. Cả A và B đều đọc status = 'todo'`);
  console.log(`   2. User B update trước → status = 'done' (t=500ms)`);
  console.log(`   3. User A update sau → status = 'in_progress' (t=1000ms)`);
  console.log(`   4. Update của User B bị GHI ĐÈ!`);
  console.log(`\n   🔴 Đây là LOST UPDATE — update của B bị mất`);
  console.log(`   → B nghĩ task đã done, nhưng thực tế là in_progress`);
  console.log(`   → Trong production: data sai, user bối rối, bug khó tìm`);

  // Dọn dẹp
  await db("tasks").where({ id: task.id }).del();
  console.log(`\n🧹 Đã xóa task thí nghiệm`);
}

simulateRaceCondition()
  .catch(console.error)
  .finally(() => db.destroy());
