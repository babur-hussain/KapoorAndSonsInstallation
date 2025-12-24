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
    bookingId: { type: String, unique: true, index: true },
    customerName: { type: String, required: true },
    email: { type: String },
    contactNumber: { type: String, required: true },
    alternateContactNumber: { type: String },
    address: { type: String, required: true },
    alternateAddress: { type: String },
    landmark: { type: String },
    serialNumber: { type: String, required: false, alias: 'serial' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true, alias: 'pincode' },
    serviceType: { 
      type: String, 
      enum: ['New Installation', 'Service Complaint'],
      default: 'New Installation'
    },
    problemDescription: { type: String },
    dateOfPurchase: { type: String },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    categoryName: { type: String }, // Denormalized for easy access
    brand: { type: String, required: true },
    model: { type: String, required: true },
    invoiceNumber: String,
    invoiceImage: { type: String },
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
    lastRescheduleEmailAt: { type: Date },
    rescheduleCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Generate unique 6-character booking ID
function generateBookingId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Pre-save hook to generate bookingId
bookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    let unique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!unique && attempts < maxAttempts) {
      this.bookingId = generateBookingId();
      const existing = await mongoose.model('Booking').findOne({ bookingId: this.bookingId });
      if (!existing) {
        unique = true;
      }
      attempts++;
    }
    
    if (!unique) {
      throw new Error('Unable to generate unique booking ID');
    }
  }
  next();
});

// Index for faster queries
bookingSchema.index({ createdBy: 1, createdAt: -1 });
bookingSchema.index({ assignedTo: 1, status: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingId: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);

