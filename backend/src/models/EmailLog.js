import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    to: {
      type: String,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    replyText: {
      type: String,
      trim: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      index: true,
    },
    replySent: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailType: {
      type: String,
      enum: ["outgoing", "incoming", "reply"],
      default: "incoming",
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    messageId: {
      type: String,
      trim: true,
      index: true, // For fast lookup of original emails
    },
    inReplyTo: {
      type: String,
      trim: true,
      index: true, // For fast email thread matching
    },
    references: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound indexes for efficient querying
emailLogSchema.index({ from: 1, timestamp: -1 });
emailLogSchema.index({ replySent: 1, timestamp: -1 });
emailLogSchema.index({ bookingId: 1, timestamp: -1 });
emailLogSchema.index({ emailType: 1, timestamp: -1 });

const EmailLog = mongoose.model("EmailLog", emailLogSchema);

export default EmailLog;

