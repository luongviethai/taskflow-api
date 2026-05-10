import db from "../db";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export default class AuthServices {
  async login(email: string, password: string) {
    return { message: "login" };
  }

  async register(email: string, password: string, name: string) {
    const userExists = await db("users").where({ email }).first();

    if (userExists) {
      return { message: "User already exits" };
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
