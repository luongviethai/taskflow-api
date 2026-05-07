import express from "express";
import { healthcheckRouter } from "./routes/healthcheck";
import { experimentRouter } from "./routes/experiment";
import { authRouter } from "./routes/auth";

const app = express();

app.use(express.json());

app.use("/healthcheck", healthcheckRouter);
app.use("/experiment", experimentRouter);
app.use("/auth", authRouter);

export { app };
