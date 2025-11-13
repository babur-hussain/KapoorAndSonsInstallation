import express from "express";
import { authorize } from "../middleware/authMiddleware.js";
import { firebaseAuth } from "../middleware/firebaseAuth.js";
import { getOverviewStats, getDailyStats } from "../controllers/statsController.js";

const router = express.Router();

// Get overview statistics (admin only)
router.get("/overview", firebaseAuth, authorize("admin"), getOverviewStats);

// Get daily statistics (admin only)
router.get("/daily", firebaseAuth, authorize("admin"), getDailyStats);

export default router;

