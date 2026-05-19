// Mở rộng type Request của Express, thêm field user.
// Sau khi auth middleware verify token, req.user.userId sẽ có type checking.

declare namespace Express {
  interface Request {
    user?: {
      id: string;
    };
  }
}
