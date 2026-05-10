import { Request, Response, Router } from "express";
import { RegisterUser } from "../validations/auth.validations";
import AuthServices from "../services/auth.services";

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

router.post("/register", async (req: Request, res: Response) => {
  const authServices = new AuthServices();

  const validate = RegisterUser.safeParse(req.body);

  if (validate.success) {
    const newUser = await authServices.register(
      validate.data.email,
      validate.data.password,
      validate.data.name,
    );

    return res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } else {
    return res.status(400).json({ error: validate.error });
  }
});

export { router as authRouter };
