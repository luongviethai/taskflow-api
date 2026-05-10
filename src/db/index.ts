import knex from "knex";
import knexConfig from "./knexfile";

// Tạo database connection instance
// Đây là singleton — cả app dùng chung 1 connection pool
const db = knex(knexConfig);

export default db;
