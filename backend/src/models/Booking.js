import mongoose from "mongoose";

const updateSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true }
);

const bookingSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    email: { type: String },
    contactNumber: { type: String, required: true },
    address: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    invoiceNumber: String,
    preferredDateTime: String,
    status: {
      type: String,
      enum: ["Pending", "Scheduled", "Completed", "Cancelled"],
      default: "Pending",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updates: [updateSchema],
  },
  { timestamps: true }
);

// Index for faster queries
bookingSchema.index({ createdBy: 1, createdAt: -1 });
bookingSchema.index({ assignedTo: 1, status: 1 });
bookingSchema.index({ status: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);

