import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "booking_created",
        "booking_updated",
        "status_updated",
        "message_sent",
        "notification_sent",
        "notification_failed",
        "brand_created",
        "brand_updated",
        "booking_email_sent",
        "booking_email_failed",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    relatedBrand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    severity: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
activityLogSchema.index({ type: 1, createdAt: -1 });
activityLogSchema.index({ relatedBooking: 1 });
activityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

