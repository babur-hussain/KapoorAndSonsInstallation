import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import bookingRoutes from "./routes/bookingRoutes.js";
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
app.use("/api/v1/bookings", bookingRoutes);

// AdminJS Dashboard
app.use(admin.options.rootPath, adminRouter);

export default app;

