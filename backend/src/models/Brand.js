import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    logo: { type: String }, // URL or path to logo image
    contactEmail: { type: String },
    whatsappNumber: { type: String },
    preferredCommunication: {
      type: [String],
      enum: ["whatsapp", "email"],
      default: ["email"],
    },
    // Legacy field for backward compatibility
    communicationMode: {
      type: String,
      enum: ["whatsapp", "email", "both"],
      default: "email",
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ], // Array of category references - each brand can serve multiple categories
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Pre-save validation hook
brandSchema.pre("save", function (next) {
  // Validate preferredCommunication requirements
  if (this.preferredCommunication && this.preferredCommunication.length > 0) {
    if (this.preferredCommunication.includes("whatsapp") && !this.whatsappNumber) {
      return next(new Error("WhatsApp number is required when WhatsApp is selected as preferred communication"));
    }
    if (this.preferredCommunication.includes("email") && !this.contactEmail) {
      return next(new Error("Email address is required when Email is selected as preferred communication"));
    }
  }

  // Sync preferredCommunication with legacy communicationMode
  if (this.preferredCommunication && this.preferredCommunication.length > 0) {
    if (this.preferredCommunication.length === 2) {
      this.communicationMode = "both";
    } else if (this.preferredCommunication.includes("whatsapp")) {
      this.communicationMode = "whatsapp";
    } else if (this.preferredCommunication.includes("email")) {
      this.communicationMode = "email";
    }
  }

  next();
});

// Virtual property to get communication methods as array
brandSchema.virtual("communicationMethods").get(function () {
  if (this.preferredCommunication && this.preferredCommunication.length > 0) {
    return this.preferredCommunication;
  }
  // Fallback to legacy communicationMode
  if (this.communicationMode === "both") {
    return ["whatsapp", "email"];
  }
  return [this.communicationMode];
});

export const Brand = mongoose.model("Brand", brandSchema);
