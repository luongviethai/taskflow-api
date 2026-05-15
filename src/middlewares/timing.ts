/**
 * src/middlewares/timing.ts
 *
 * Đo response time cho MỌI request, log ra console.
 * Tuần 1 đã viết — giữ nguyên.
 *
 * process.hrtime.bigint() cho độ chính xác nanosecond.
 * Lắng nghe event 'finish' trên response để biết khi nào xong.
 */

import { Request, Response, NextFunction } from 'express';

export function timingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    console.log(
      `${req.method} ${req.originalUrl} → ${res.statusCode} (${durationMs.toFixed(2)}ms)`
    );
  });

  next();
}
