import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    icon: { type: String }, // URL or path to category icon
    alternateAddress: { type: String }, // Additional address field for category
    landmark: { type: String }, // Landmark/location reference for category
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }, // For sorting categories
  },
  { timestamps: true }
);

// Index for faster queries
categorySchema.index({ isActive: 1, displayOrder: 1 });

export const Category = mongoose.model("Category", categorySchema);
