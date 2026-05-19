import { Request, Response, NextFunction } from "express";

let queryCount = 0;

export function queryCounterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  queryCount = 0;
  res.on("finish", () => {
    if (queryCount > 10) {
      console.warn(`⚠️ ${req.method} ${req.path} — ${queryCount} queries!`);
    }
  });
  next();
}
