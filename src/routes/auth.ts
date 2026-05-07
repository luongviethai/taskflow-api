import { Request, Response, Router } from "express";
import { RegisterUser } from "../validations/auth.validations";

const router = Router();

const user = [
  {
    name: "John Doe",
    email: "user1@gmail.com",
    password: "12345678",
  },
];

router.post("/login", (req: Request, res: Response) => {
  console.log("req", req.body);

  res.send({ message: "login" });
});

router.post("/register", (req: Request, res: Response) => {
  const validate = RegisterUser.safeParse(req.body);

  if (validate.success) {
    const userExists = user.find((u) => u.email === validate.data.email);

    if (userExists) {
      return res.status(422).json({ error: "User already exists" });
    }

    user.push(validate.data);

    return res
      .status(200)
      .json({ message: "User registered successfully", user });
  } else {
    return res.status(400).json({ error: validate.error });
  }
});

export { router as authRouter };
