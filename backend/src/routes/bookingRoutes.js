import express from "express";
import { authorize } from "../middleware/authMiddleware.js";
import { firebaseAuth, dualAuth } from "../middleware/firebaseAuth.js";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getUserBookings,
  updateBookingStatusWithNotification,
  getBookingEmails,
  rescheduleBookingEmail,
} from "../controllers/bookingController.js";

const router = express.Router();

// Note: Using Firebase authentication only for production
// All routes require valid Firebase ID token

// Create a new booking (protected - requires authentication, accessible to all logged-in users)
router.post("/", firebaseAuth, createBooking);

// Get user's own bookings (protected - customer)
router.get("/user", firebaseAuth, getUserBookings);

// Get all bookings (protected - admin/staff only)
router.get("/", firebaseAuth, authorize("admin", "staff"), getAllBookings);

// Trigger reschedule email webhook via body payload (protected - customer/admin)
router.post("/reschedule-email", dualAuth, rescheduleBookingEmail);

// Get booking by ID (protected - requires authentication)
router.get("/:id", firebaseAuth, getBookingById);

// Get email communications for a specific booking (protected - requires authentication)
router.get("/:id/emails", firebaseAuth, getBookingEmails);

// Trigger reschedule email webhook via path param (protected - customer/admin)
router.post("/:id/reschedule-email", dualAuth, rescheduleBookingEmail);

// Update booking status with notification (protected - admin/staff only)
router.patch("/:id/status", firebaseAuth, authorize("admin", "staff"), updateBookingStatusWithNotification);

// Update booking status (deprecated - kept for backward compatibility)
router.patch("/:id", firebaseAuth, updateBookingStatus);

export default router;

