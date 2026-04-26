import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";
import photoRoutes from "./routes/photo.routes.js";
import referenceRoutes from "./routes/reference.routes.js";
import userRoutes from "./routes/user.routes.js";
import vehicleManageRoutes from "./routes/vehicleManage.routes.js";
import photoManageRoutes from "./routes/photoManage.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("Backend is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/manage/vehicles", vehicleManageRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/manage/photos", photoManageRoutes);
app.use("/api/reference", referenceRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});