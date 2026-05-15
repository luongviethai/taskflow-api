/**
 * src/middlewares/error-handler.ts
 *
 * Middleware cuối cùng trong chain — bắt MỌI lỗi.
 *
 * AppError (operational) → trả đúng status code + message cho client
 * Error thường (bug)     → trả 500 + message chung, KHÔNG lộ stack trace
 *
 * PHẢI có 4 params (err, req, res, next) để Express nhận diện là error middleware.
 */

import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-errors";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log mọi lỗi — cần cho debug
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  if (err instanceof AppError) {
    // Lỗi dự đoán được — trả message cho client
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // Bug thật — KHÔNG lộ chi tiết
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack); // Log stack trace chỉ ở dev
  }

  res.status(500).json({
    error: "Internal server error",
  });
}
