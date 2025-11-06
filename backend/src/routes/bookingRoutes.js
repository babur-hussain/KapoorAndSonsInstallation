import express from "express";
import { Booking } from "../models/Booking.js";

const router = express.Router();

// Create a new booking
router.post("/", async (req, res) => {
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
    res.json({ success: true, booking });
  } catch (err) {
    console.error("❌ Booking error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all bookings
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error("❌ Error fetching bookings:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get booking by ID
router.get("/:id", async (req, res) => {
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

// Update booking status
router.patch("/:id", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.json({ success: true, booking });
  } catch (err) {
    console.error("❌ Error updating booking:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

