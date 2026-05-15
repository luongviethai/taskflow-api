import { Knex } from "knex";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { ConflictError, UnauthorizedError } from "../errors/app-errors";

export class AuthService {
  constructor(private db: Knex) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.db("users").where({ email }).first();
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    // Cost factor 10 = ~100ms — đủ an toàn, không quá chậm
    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await this.db("users")
      .insert({ email, password_hash: passwordHash, name, created_at: new Date() })
      .returning(["id", "email", "name", "created_at"]);

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.db("users").where({ email }).first();

    // Message chung — không lộ "email không tồn tại" vs "sai password"
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"] },
    );

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
