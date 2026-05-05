import express from 'express';
import { healthcheckRouter } from './routes/healthcheck';

const app = express();
app.use(express.json());
app.use('/healthcheck', healthcheckRouter);

export { app };