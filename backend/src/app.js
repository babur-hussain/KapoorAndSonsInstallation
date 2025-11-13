import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import modelRoutes from "./routes/modelRoutes.js";
import adminStatsRoutes from "./routes/adminStats.js";
import statsRoutes from "./routes/statsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import emailHookRoutes from "./routes/emailHookRoutes.js";
import { admin, adminRouter } from "./admin/admin.js";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Kapoor & Sons API is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/brands", brandRoutes);
app.use("/api/v1/models", modelRoutes);
app.use("/api/v1/stats", statsRoutes);
app.use("/api/v1/admin/stats", adminStatsRoutes);

// Email Hook Routes (for n8n automation)
app.use("/api", emailHookRoutes);

// AdminJS Dashboard
app.use(admin.options.rootPath, adminRouter);

export default app;

