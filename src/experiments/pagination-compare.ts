import db from "../db";

async function comparePagination() {
  console.log("=== SO SÁNH OFFSET vs CURSOR PAGINATION ===\n");
  console.log("Bảng tasks có ~1 triệu record\n");

  // ─── Test 1: Offset ở các vị trí khác nhau ───

  console.log("📊 OFFSET-BASED PAGINATION:");
  console.log("─".repeat(50));

  const offsets = [0, 1000, 10000, 100000, 500000];

  for (const offset of offsets) {
    const start = Date.now();

    await db("tasks").orderBy("created_at", "desc").limit(20).offset(offset);

    const duration = Date.now() - start;
    const bar = "█".repeat(Math.min(Math.round(duration / 10), 50));
    console.log(
      `  OFFSET ${String(offset).padStart(6)}: ${String(duration).padStart(5)}ms ${bar}`,
    );
  }

  // ─── Test 2: Cursor-based ở các vị trí tương đương ───

  console.log("\n📊 CURSOR-BASED PAGINATION:");
  console.log("─".repeat(50));

  // Lấy cursor tại các vị trí tương đương với offset ở trên
  // Đầu tiên, lấy created_at tại các vị trí đó
  for (const offset of offsets) {
    // Tìm cursor tại vị trí offset
    const cursorRow = await db("tasks")
      .select("created_at")
      .orderBy("created_at", "desc")
      .offset(offset)
      .limit(1)
      .first();

    if (!cursorRow) continue;

    const cursorValue = cursorRow.created_at;

    // Bây giờ đo tốc độ query với cursor
    const start = Date.now();

    await db("tasks")
      .where("created_at", "<", cursorValue)
      .orderBy("created_at", "desc")
      .limit(20);

    const duration = Date.now() - start;
    const bar = "█".repeat(Math.min(Math.round(duration / 10), 50));
    console.log(
      `  Vị trí ~${String(offset).padStart(6)}: ${String(duration).padStart(5)}ms ${bar}`,
    );
  }

  // ─── So sánh trực tiếp ───

  console.log("\n📊 SO SÁNH TRỰC TIẾP TẠI VỊ TRÍ 100,000:");
  console.log("─".repeat(50));

  // Offset
  const offsetStart = Date.now();
  await db("tasks").orderBy("created_at", "desc").limit(20).offset(100000);
  const offsetTime = Date.now() - offsetStart;

  // Cursor
  const cursorRow = await db("tasks")
    .select("created_at")
    .orderBy("created_at", "desc")
    .offset(100000)
    .limit(1)
    .first();

  const cursorStart = Date.now();
  await db("tasks")
    .where("created_at", "<", cursorRow.created_at)
    .orderBy("created_at", "desc")
    .limit(20);
  const cursorTime = Date.now() - cursorStart;

  console.log(`  Offset-based: ${offsetTime}ms`);
  console.log(`  Cursor-based: ${cursorTime}ms`);
  console.log(`  Cursor nhanh hơn: ${(offsetTime / cursorTime).toFixed(1)}x`);
}

comparePagination()
  .catch(console.error)
  .finally(() => db.destroy());
