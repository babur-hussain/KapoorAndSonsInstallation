import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    address: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    invoiceNumber: String,
    preferredDateTime: String,
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);

