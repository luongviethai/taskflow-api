/**
 * src/routes/auth.routes.ts
 *
 * Auth endpoints từ tuần 2. Register + Login.
 * Code "thô" — chưa refactor sang service layer.
 * (Auth service sẽ refactor cùng lúc với workspace/task nếu muốn)
 */

import { Router, Request, Response } from "express";
import { Knex } from "knex";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { validate } from "../validators/validate";
import { registerSchema, loginSchema } from "../validators/auth.validator";

export function authRoutes(db: Knex): Router {
  const router = Router();

  // ==========================================
  // POST /auth/register
  // ==========================================
  router.post(
    "/auth/register",
    validate(registerSchema),
    async (req: Request, res: Response) => {
      try {
        const { email, password, name } = req.body;

        // Check email đã tồn tại chưa
        const existingUser = await db("users").where({ email }).first();
        if (existingUser) {
          return res.status(409).json({ error: "Email already registered" });
        }

        // Hash password — bcrypt tự thêm salt
        // Cost factor 10 = ~100ms trên máy thường — đủ an toàn, không quá chậm
        const passwordHash = await bcrypt.hash(password, 10);

        const [user] = await db("users")
          .insert({
            email,
            password_hash: passwordHash,
            name,
            created_at: new Date(),
          })
          .returning(["id", "email", "name", "created_at"]);
        // KHÔNG returning password_hash!

        res.status(201).json(user);
      } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // ==========================================
  // POST /auth/login
  // ==========================================
  router.post(
    "/auth/login",
    validate(loginSchema),
    async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;

        // Tìm user theo email
        const user = await db("users").where({ email }).first();
        if (!user) {
          // Message chung — không lộ "email không tồn tại" vs "sai password"
          return res.status(401).json({ error: "Invalid email or password" });
        }

        // So sánh password với hash
        const isValidPassword = await bcrypt.compare(
          password,
          user.password_hash,
        );
        if (!isValidPassword) {
          return res.status(401).json({ error: "Invalid email or password" });
        }

        // Sign JWT
        const token = jwt.sign(
          { id: user.id, email: user.email },
          config.jwt.secret,
          { expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"] },
        );

        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        });
      } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  return router;
}
