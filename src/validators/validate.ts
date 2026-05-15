/**
 * src/validators/validate.ts
 *
 * Middleware factory: nhận Zod schema → trả Express middleware.
 *
 * Cách dùng:
 *   router.post('/tasks', validate(createTaskSchema), controller.create)
 *
 * Nếu validation fail → trả 422 + chi tiết lỗi.
 * Nếu pass → ghi đè req.body/params/query bằng data đã parse (trim, default...).
 */

import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export function validate(schema: ZodObject) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const errors = (result.error as ZodError).issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      res.status(422).json({
        error: "Validation Failed",
        message: "The request payload is invalid",
        errors,
      });
      return;
    }

    // Ghi đè bằng data đã parse — đã trim, có default value, đúng type
    if (result.data.body) req.body = result.data.body;
    if (result.data.params) req.params = result.data.params as Record<string, string>;
    if (result.data.query) req.query = result.data.query as Record<string, string>;

    next();
  };
}
