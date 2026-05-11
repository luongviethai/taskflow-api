import { Request, Response, Router } from "express";
import { RegisterUser, LoginUser } from "../validations/auth.validations";
import AuthServices from "../services/auth.services";

const router = Router();

const authServices = new AuthServices();

router.post("/login", async (req: Request, res: Response) => {
  const validate = LoginUser.safeParse(req.body);

  if (validate.success) {
    const user = await authServices.login(
      validate.data.email,
      validate.data.password,
    );

    return res.status(200).json(user);
  } else {
    return res.status(400).json({ error: validate.error });
  }
});

router.post("/register", async (req: Request, res: Response) => {
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
