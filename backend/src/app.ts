import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("Backend is running");
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});