import express from "express";
import { healthcheckRouter } from "./routes/healthcheck";
import { experimentRouter } from "./routes/experiment";
import { authRouter } from "./routes/auth";
import { errorHandler } from "./middlewares/error-handler";
import { authMiddleware } from "./middlewares/auth";

const app = express();

app.use(express.json());

app.use("/healthcheck", healthcheckRouter);
app.use("/experiment", experimentRouter);
app.use("/auth", authRouter);
app.use("/protected", authMiddleware, (req, res) => {
  res.json({ message: "Protected route" });
});
app.use(errorHandler);

export { app };
