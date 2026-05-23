import db from "../db";

async function offsetBasePaginations(offset: number, limit: number) {
  const result = await db("tasks").offset(offset).limit(limit).select("*");
  return result;
}

offsetBasePaginations(0, 10)
  .then((tasks) => {
    console.log("First page of tasks:", tasks.length);
  })
  .catch((error) => {
    console.error("Error fetching tasks:", error);
  });
