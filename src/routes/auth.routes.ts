import { Router } from "express";
import { Knex } from "knex";
import { validate } from "../validators/validate";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { AuthService } from "../services/auth.service";
import { AuthController } from "../controllers/auth.controller";

export function authRoutes(db: Knex): Router {
  const router = Router();

  const authService = new AuthService(db);
  const controller = new AuthController(authService);

  router.post("/auth/register", validate(registerSchema), controller.register);
  router.post("/auth/login", validate(loginSchema), controller.login);

  return router;
}
