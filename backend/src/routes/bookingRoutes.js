import express from "express";
import { authorize } from "../middleware/authMiddleware.js";
import { firebaseAuth } from "../middleware/firebaseAuth.js";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getUserBookings,
  updateBookingStatusWithNotification,
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

// Get booking by ID (protected - requires authentication)
router.get("/:id", firebaseAuth, getBookingById);

// Update booking status with notification (protected - admin/staff only)
router.patch("/:id/status", firebaseAuth, authorize("admin", "staff"), updateBookingStatusWithNotification);

// Update booking status (deprecated - kept for backward compatibility)
router.patch("/:id", firebaseAuth, updateBookingStatus);

export default router;

