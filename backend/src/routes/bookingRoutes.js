import express from "express";
import { Booking } from "../models/Booking.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { sendNotifications } from "../utils/notify.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new booking (protected - requires authentication)
router.post("/", protect, async (req, res) => {
  try {
    console.log("📝 Received booking request:", req.body);

    // Map mobile app field names to database field names
    const bookingData = {
      customerName: req.body.name,
      contactNumber: req.body.phone,
      address: req.body.address,
      brand: req.body.brand,
      model: req.body.model,
      invoiceNumber: req.body.invoiceNo,
      preferredDateTime: req.body.preferredAt,
    };

    const booking = new Booking(bookingData);
    await booking.save();

    console.log("✅ Booking saved:", booking);

    // 🔔 Send notifications (async, don't wait for completion)
    sendNotifications(booking).catch((err) => {
      console.error("⚠️  Notification failed but booking was saved:", err.message);
    });

    res.json({ success: true, booking });
  } catch (err) {
    console.error("❌ Booking error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all bookings (protected - requires authentication)
router.get("/", protect, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error("❌ Error fetching bookings:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get booking by ID (protected - requires authentication)
router.get("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.json(booking);
  } catch (err) {
    console.error("❌ Error fetching booking:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update booking status (protected - requires authentication)
router.patch("/:id", protect, async (req, res) => {
  try {
    const oldBooking = await Booking.findById(req.params.id);
    if (!oldBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    // Log status update
    await ActivityLog.create({
      type: "status_updated",
      message: `Booking status updated from "${oldBooking.status}" to "${booking.status}" for ${booking.customerName}`,
      relatedBooking: booking._id,
      metadata: {
        oldStatus: oldBooking.status,
        newStatus: booking.status,
        customerName: booking.customerName,
        brand: booking.brand,
      },
      severity: "info",
    });

    console.log(`✅ Booking status updated: ${oldBooking.status} → ${booking.status}`);
    res.json({ success: true, booking });
  } catch (err) {
    console.error("❌ Error updating booking:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

