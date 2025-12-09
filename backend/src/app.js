import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { connectDB } from "./config/db.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import modelRoutes from "./routes/modelRoutes.js";
import adminStatsRoutes from "./routes/adminStats.js";
import statsRoutes from "./routes/statsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import emailHookRoutes from "./routes/emailHookRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/brands", brandRoutes);
app.use("/api/v1/models", modelRoutes);
app.use("/api/v1/stats", statsRoutes);
app.use("/api/v1/admin/stats", adminStatsRoutes);
app.use("/api/v1/uploads", uploadRoutes);

// Email Hook Routes (for n8n automation)
app.use("/api", emailHookRoutes);

// AdminJS Dashboard (can be disabled in low-memory environments)
// Default to disabled on Render free tier to avoid OOM crashes
const shouldDisableAdmin = 
  process.env.DISABLE_ADMIN_DASHBOARD === "true" || 
  process.env.RENDER === "true";

if (shouldDisableAdmin) {
  console.warn("⚠️ Admin dashboard disabled (low memory environment detected)");
} else {
  const { admin, adminRouter } = await import("./admin/admin.js");
  app.use(admin.options.rootPath, adminRouter);
}

export default app;

