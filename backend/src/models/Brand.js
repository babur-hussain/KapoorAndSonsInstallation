import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    contactEmail: { type: String },
    whatsappNumber: { type: String },
    communicationMode: {
      type: String,
      enum: ["whatsapp", "email", "both"],
      default: "email",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Brand = mongoose.model("Brand", brandSchema);

