import mongoose from "mongoose";

const modelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    description: {
      type: String,
    },
    specifications: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create compound index for brand + name to ensure unique model names per brand
modelSchema.index({ brand: 1, name: 1 }, { unique: true });

export const Model = mongoose.model("Model", modelSchema);

