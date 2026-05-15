import db from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/env";

const SALT_ROUNDS = 10;

const JWT_SECRET = process.env.JWT_SECRET;

export default class AuthServices {
  async login(email: string, password: string) {
    const userExists = await db("users").where({ email }).first();

    if (!userExists) {
      throw new Error("User does not exist");
    }

    const passwordMatch = await bcrypt.compare(
      password,
      userExists.password_hash,
    );

    if (!passwordMatch) {
      throw new Error("Invalid password");
    }

    const token = jwt.sign({ id: userExists.id }, config.jwt.secret, {
      expiresIn: "15m",
    });

    return {
      token,
      user: {
        id: userExists.id,
        email: userExists.email,
        name: userExists.name,
      },
    };
  }

  async register(email: string, password: string, name: string) {
    const userExists = await db("users").where({ email }).first();

    if (userExists) {
      throw new Error("User already exits");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await db("users")
      .insert({
        email,
        password_hash: passwordHash,
        name,
      })
      .returning(["id", "email", "name", "created_at"]);

    return user;
  }
}
