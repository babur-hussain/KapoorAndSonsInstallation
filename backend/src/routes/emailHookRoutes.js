import express from "express";
import {
  receiveEmailHook,
  getEmailLogs,
  getEmailStats,
} from "../controllers/emailHookController.js";

const router = express.Router();

/**
 * Email Hook Routes
 * Handles incoming email webhooks from n8n automation workflow
 */

// POST /api/email-hook - Receive email webhook from n8n
router.post("/email-hook", receiveEmailHook);

// GET /api/email-hook/logs - Get email logs with pagination
router.get("/email-hook/logs", getEmailLogs);

// GET /api/email-hook/stats - Get email statistics
router.get("/email-hook/stats", getEmailStats);

export default router;

