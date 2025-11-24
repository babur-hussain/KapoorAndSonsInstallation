import { Booking } from "../models/Booking.js";
import { Brand } from "../models/Brand.js";
import { Category } from "../models/Category.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { User } from "../models/User.js";
import {
  sendBookingConfirmationToCustomer,
  sendNewBookingToBrand,
} from "../services/whatsappService.js";
import {
  sendBookingConfirmationEmail,
  sendNewBookingEmailToBrand,
} from "../services/emailService.js";
import { triggerDemoBookingEmail, triggerBookingWebhook } from "../services/n8nService.js";

/**
 * Log activity to database
 */
async function logActivity(type, message, bookingId, metadata = {}, severity = "info") {
  try {
    await ActivityLog.create({
      type,
      message,
      relatedBooking: bookingId,
      metadata,
      severity,
    });
    console.log(`📝 Activity logged: ${type} - ${message}`);
  } catch (error) {
    console.error("❌ Failed to log activity:", error.message);
  }
}

/**
 * Create a new booking
 * @route POST /api/v1/bookings
 * @access Protected (all authenticated users)
 */
export const createBooking = async (req, res) => {
  try {
    console.log("📝 Received booking request:", req.body);

    // Normalize incoming fields: accept multiple possible key names from clients
    const getField = (keys, fallback = undefined) => {
      for (const k of keys) {
        if (req.body[k] !== undefined && req.body[k] !== null) return req.body[k];
      }
      return fallback;
    };

    const customerName = getField(['name', 'customerName', 'customer_name'], '');
    // Accept multiple possible email field names from different clients
    const rawEmail = getField(
      ['email', 'customerEmail', 'customer_email', 'emailAddress', 'email_address'],
      ''
    );
    // If standard keys don't contain email, attempt a deep search in the body
    const isValidEmail = (s) => typeof s === 'string' && /\S+@\S+\.\S+/.test(s);
    const findEmailDeep = (obj, seen = new Set()) => {
      if (!obj || typeof obj !== 'object') return null;
      if (seen.has(obj)) return null;
      seen.add(obj);
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (isValidEmail(v)) return v;
        if (v && typeof v === 'object') {
          const found = findEmailDeep(v, seen);
          if (found) return found;
        }
      }
      return null;
    };

    let detectedEmail = rawEmail;

    // Check several common nested locations that some clients use
    const getEmailFromCommonPaths = (body) => {
      if (!body || typeof body !== 'object') return null;
      const paths = [
        ['booking', 'email'],
        ['booking', 'customerEmail'],
        ['data', 'email'],
        ['payload', 'email'],
        ['form', 'email'],
        ['values', 'email'],
        ['user', 'email'],
        ['contact', 'email'],
      ];
      for (const p of paths) {
        let cur = body;
        for (const k of p) {
          if (!cur) break;
          cur = cur[k];
        }
        if (cur && typeof cur === 'string' && cur.trim() !== '') return cur;
      }
      return null;
    };

    if (!detectedEmail || (typeof detectedEmail === 'string' && detectedEmail.trim() === '')) {
      // 1) Try common explicit nested paths
      const common = getEmailFromCommonPaths(req.body);
      if (common) detectedEmail = common;

      // 2) Fallback to deep search across the whole body
      if ((!detectedEmail || (typeof detectedEmail === 'string' && detectedEmail.trim() === '')) ) {
        const deep = findEmailDeep(req.body);
        if (deep) detectedEmail = deep;
      }
    }

    const email = typeof detectedEmail === 'string' ? detectedEmail.trim() : detectedEmail;
    const contactNumber = getField(['phone', 'contactNumber', 'contact_number'], '');
    const alternateContactNumber = getField(['alternatePhone', 'alternateContactNumber', 'alternate_phone'], '');
    const address = getField(['address', 'customerAddress'], '');
    const alternateAddress = getField(['alternateAddress', 'alternate_address'], '');
    const landmark = getField(['landmark'], '');
    const serialNumber = getField(['serialNumber', 'serial_number', 'serial', 'serialNo', 'serial_no'], null);
    const city = getField(['city', 'town'], null);
    const state = getField(['state', 'region'], null);
    const pinCode = getField(['pinCode', 'pincode', 'pin_code', 'postalCode'], null);
    const serviceType = getField(['serviceType', 'service_type', 'type'], 'New Installation');
    const problemDescription = getField(['problemDescription', 'problem_description', 'problem', 'issue'], '');
    const category = getField(['category', 'categoryId', 'category_id'], null);
    const categoryName = getField(['categoryName', 'category_name'], getField(['categoryName', 'category_name'], ''));
    const brand = getField(['brand'], '');
    const model = getField(['model'], '');
    const invoiceNumber = getField(['invoiceNo', 'invoiceNumber', 'invoice_no'], '');
    const preferredDateTime = getField(['preferredAt', 'preferredDateTime', 'preferred_at'], null);

    // If category id missing but categoryName provided, try to resolve id
    let categoryIdToSave = category;
    if ((!categoryIdToSave || categoryIdToSave === '') && categoryName) {
      try {
        const cat = await Category.findOne({ name: categoryName });
        if (cat) categoryIdToSave = cat._id;
      } catch (e) {
        console.warn('Category lookup failed:', e.message);
      }
    }

    // Validate required location fields early to provide immediate feedback
    if (!city || !state || !pinCode) {
      return res.status(400).json({
        success: false,
        message: 'City, state and pinCode are required',
      });
    }

    // Map normalized fields into bookingData for persistence
    const bookingData = {
      customerName,
      // Preserve the exact user input email (trimmed). Only populate from the
      // authenticated user when this is empty.
      email,
      contactNumber,
      alternateContactNumber,
      address,
      alternateAddress,
      landmark,
      serialNumber,
      city,
      state,
      pinCode,
      serviceType,
      problemDescription,
      category: categoryIdToSave,
      categoryName,
      brand,
      model,
      invoiceNumber,
      preferredDateTime,
      createdBy: req.user?._id || null, // Track who created the booking if available
    };

    // If email not provided in the request, try to populate it from the authenticated user
    if ((!bookingData.email || bookingData.email === '') && req.user?._id) {
      try {
        // Prefer req.user.email if available on the request object
        if (req.user.email) {
          bookingData.email = req.user.email;
        } else {
          // Otherwise fetch the full user record to get the email
          const userRecord = await User.findById(req.user._id).lean();
          if (userRecord && userRecord.email) bookingData.email = userRecord.email;
        }
      } catch (e) {
        console.warn('Could not populate booking email from user record:', e.message);
      }
    }

    // Debug: show resolved email values to help trace empty-email issues
    console.log("🔍 Resolved booking emails -> formEmail:", rawEmail, "trimmedEmail:", email, "finalBookingEmail:", bookingData.email, "req.user.email:", req.user?.email);

    // Create and save booking
    const booking = new Booking(bookingData);
    await booking.save();

    console.log("✅ Booking saved (pre-refresh):", booking._id);

    // Re-fetch the saved booking from DB to ensure persisted fields (and defaults)
    const savedBooking = await Booking.findById(booking._id).lean();
    console.log("🔁 Refetched saved booking:", savedBooking);

    // Log booking creation
    await logActivity(
      "booking_created",
      `New booking created for ${booking.customerName} - ${booking.brand} ${booking.model}`,
      booking._id,
      {
        customerName: booking.customerName,
        brand: booking.brand,
        model: booking.model,
        status: booking.status,
      },
      "success"
    );

    // Send notifications asynchronously (don't wait for completion)
    sendNotifications(booking).catch((err) => {
      console.error("⚠️  Notification failed but booking was saved:", err.message);
    });

    // Trigger n8n email automation workflow (async, don't block response)
    if (booking.status === "Pending") {
      triggerDemoBookingEmail(booking)
        .then((result) => {
          if (result && result.success) {
            console.log("✅ n8n email workflow triggered successfully");
            logActivity(
              "booking_email_sent",
              `n8n email workflow triggered for booking ${booking._id}`,
              booking._id,
              { n8nResponse: result.data },
              "success"
            );
          } else {
            console.log("⚠️  n8n email workflow trigger failed");
            logActivity(
              "booking_email_failed",
              `n8n email workflow failed for booking ${booking._id}`,
              booking._id,
              { error: result?.error },
              "warning"
            );
          }
        })
        .catch((err) => {
          console.error("❌ n8n trigger error:", err.message);
          logActivity(
            "booking_email_failed",
            `n8n trigger error for booking ${booking._id}: ${err.message}`,
            booking._id,
            { error: err.message },
            "error"
          );
        });
    }

    // Trigger booking webhook (async) with required format — use the re-fetched saved booking
    triggerBookingWebhook(savedBooking)
      .then((result) => {
        if (result && result.success) {
          logActivity(
            "booking_webhook_sent",
            `Booking webhook sent for ${booking._id}`,
            booking._id,
            { webhookResponse: result.data },
            "success"
          );
        } else {
          logActivity(
            "booking_webhook_failed",
            `Booking webhook failed for ${booking._id}: ${result?.error}`,
            booking._id,
            { error: result?.error },
            "warning"
          );
        }
      })
      .catch((err) => {
        console.error('❌ Booking webhook unexpected error:', err.message);
        logActivity(
          "booking_webhook_failed",
          `Booking webhook unexpected error for ${booking._id}: ${err.message}`,
          booking._id,
          { error: err.message },
          "error"
        );
      });

    // Emit Socket.IO event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.emit("bookingCreated", {
        bookingId: booking._id,
        customerName: booking.customerName,
        brand: booking.brand,
        model: booking.model,
        status: booking.status,
        createdAt: booking.createdAt,
      });
      console.log("⚡ Socket event emitted: bookingCreated");
    }

    res.json({ success: true, booking });
  } catch (err) {
    console.error("❌ Booking error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Send notifications to customer and brand/installer
 * @param {Object} booking - The booking object
 */
async function sendNotifications(booking) {
  try {
    console.log("📢 Starting notification process for booking:", booking._id);

    // 1️⃣ Notify customer
    await notifyCustomer(booking);

    // 2️⃣ Notify brand/installer based on their preference
    await notifyBrand(booking);

    console.log("✅ All notifications sent successfully");
  } catch (error) {
    console.error("❌ Notification error:", error.message);

    // Log notification failure
    await logActivity(
      "notification_failed",
      `Notification failed for booking ${booking._id}: ${error.message}`,
      booking._id,
      { error: error.message },
      "error"
    );
  }
}

/**
 * Notify customer about their booking via WhatsApp AND Email
 */
async function notifyCustomer(booking) {
  console.log("📱 Notifying customer:", booking.customerName);

  let whatsappSent = false;
  let emailSent = false;

  // 1️⃣ Send WhatsApp notification (if phone number is provided)
  if (booking.contactNumber) {
    const whatsappResult = await sendBookingConfirmationToCustomer(booking);

    if (whatsappResult) {
      console.log(`✅ Customer WhatsApp notification sent to ${booking.contactNumber}`);
      whatsappSent = true;

      // Log successful customer notification
      await logActivity(
        "message_sent",
        `WhatsApp notification sent to customer ${booking.customerName}`,
        booking._id,
        { channel: "whatsapp", recipient: booking.contactNumber },
        "success"
      );
    } else {
      console.log("⚠️  WhatsApp notification failed or not configured");
    }
  }

  // 2️⃣ Send Email notification (if email is provided)
  if (booking.email) {
    const emailResult = await sendBookingConfirmationEmail(booking, booking.email);

    if (emailResult) {
      console.log(`✅ Customer email notification sent to ${booking.email}`);
      emailSent = true;

      // Log successful customer email notification
      await logActivity(
        "message_sent",
        `Email notification sent to customer ${booking.customerName}`,
        booking._id,
        { channel: "email", recipient: booking.email },
        "success"
      );
    } else {
      console.log("⚠️  Email notification failed or not configured");
    }
  }

  // 3️⃣ Log if no notifications were sent
  if (!whatsappSent && !emailSent) {
    console.log("⚠️  No customer notifications sent (no contact info or services not configured)");
    await logActivity(
      "notification_failed",
      `No customer notifications sent for ${booking.customerName}`,
      booking._id,
      { reason: "No contact info or services not configured" },
      "warning"
    );
  } else {
    const channels = [];
    if (whatsappSent) channels.push("WhatsApp");
    if (emailSent) channels.push("Email");
    console.log(`✅ Customer notified via: ${channels.join(" & ")}`);
  }
}

/**
 * Notify brand/installer based on their communication preference
 */
async function notifyBrand(booking) {
  console.log("🏢 Notifying brand:", booking.brand);

  // Fetch brand configuration from database
  const brand = await Brand.findOne({ name: booking.brand, isActive: true });

  if (!brand) {
    console.log(`⚠️  No brand configuration found for: ${booking.brand}`);
    await logActivity(
      "notification_failed",
      `No brand configuration found for ${booking.brand}`,
      booking._id,
      { brand: booking.brand },
      "warning"
    );
    return;
  }

  console.log(`📋 Brand communication mode: ${brand.communicationMode}`);

  // Send based on communication mode
  if (brand.communicationMode === "whatsapp") {
    await sendWhatsAppToBrand(booking, brand);
  } else if (brand.communicationMode === "email") {
    await sendEmailToBrand(booking, brand);
  } else if (brand.communicationMode === "both") {
    // Send both WhatsApp and Email
    await sendWhatsAppToBrand(booking, brand);
    await sendEmailToBrand(booking, brand);
  } else {
    console.log(`⚠️  Invalid communication mode for brand: ${brand.name}`);
    await logActivity(
      "notification_failed",
      `Invalid communication mode for brand ${brand.name}`,
      booking._id,
      { brand: brand.name, mode: brand.communicationMode },
      "warning"
    );
  }
}

/**
 * Send WhatsApp notification to brand
 */
async function sendWhatsAppToBrand(booking, brand) {
  if (!brand.whatsappNumber) {
    console.log(`⚠️  No WhatsApp number configured for brand: ${brand.name}`);
    return;
  }

  const result = await sendNewBookingToBrand(booking, brand.whatsappNumber);

  if (result) {
    console.log(`✅ Brand WhatsApp notification sent to ${brand.name}`);
    await logActivity(
      "notification_sent",
      `WhatsApp notification sent to brand ${brand.name}`,
      booking._id,
      { channel: "whatsapp", brand: brand.name, recipient: brand.whatsappNumber },
      "success"
    );
  } else {
    console.log(`❌ Failed to send WhatsApp to brand: ${brand.name}`);
    await logActivity(
      "notification_failed",
      `WhatsApp notification failed for brand ${brand.name}`,
      booking._id,
      { channel: "whatsapp", brand: brand.name },
      "error"
    );
  }
}

/**
 * Send email notification to brand
 */
async function sendEmailToBrand(booking, brand) {
  if (!brand.contactEmail) {
    console.log(`⚠️  No email configured for brand: ${brand.name}`);
    return;
  }

  const result = await sendNewBookingEmailToBrand(booking, brand.contactEmail);

  if (result) {
    console.log(`✅ Brand email notification sent to ${brand.name}`);
    await logActivity(
      "notification_sent",
      `Email notification sent to brand ${brand.name}`,
      booking._id,
      { channel: "email", brand: brand.name, recipient: brand.contactEmail },
      "success"
    );
  } else {
    console.log(`❌ Failed to send email to brand: ${brand.name}`);
    await logActivity(
      "notification_failed",
      `Email notification failed for brand ${brand.name}`,
      booking._id,
      { channel: "email", brand: brand.name },
      "error"
    );
  }
}

/**
 * Get all bookings
 * @route GET /api/v1/bookings
 * @access Protected (all authenticated users)
 */
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error("❌ Error fetching bookings:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get booking by ID
 * @route GET /api/v1/bookings/:id
 * @access Protected (all authenticated users)
 */
export const getBookingById = async (req, res) => {
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
};

/**
 * Update booking status (deprecated - use updateBookingStatusWithNotification)
 * @route PATCH /api/v1/bookings/:id
 * @access Protected (all authenticated users)
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const oldBooking = await Booking.findById(req.params.id);
    if (!oldBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    // Log status update
    await logActivity(
      "status_updated",
      `Booking status updated from "${oldBooking.status}" to "${booking.status}" for ${booking.customerName}`,
      booking._id,
      {
        oldStatus: oldBooking.status,
        newStatus: booking.status,
        customerName: booking.customerName,
        brand: booking.brand,
      },
      "info"
    );

    console.log(`✅ Booking status updated: ${oldBooking.status} → ${booking.status}`);
    res.json({ success: true, booking });
  } catch (err) {
    console.error("❌ Error updating booking:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get bookings for logged-in user
 * @route GET /api/v1/bookings/user
 * @access Protected (customer)
 */
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ createdBy: req.user._id })
      .populate("assignedTo", "name email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    console.error("❌ Error fetching user bookings:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update booking status with notification
 * @route PATCH /api/v1/bookings/:id/status
 * @access Protected (admin/staff)
 */
export const updateBookingStatusWithNotification = async (req, res) => {
  try {
    const { status, message, assignedTo } = req.body;

    const oldBooking = await Booking.findById(req.params.id);
    if (!oldBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Prepare update data
    const updateData = { status };
    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    // Add update message to timeline
    if (message) {
      updateData.$push = {
        updates: {
          message,
          timestamp: new Date(),
          updatedBy: req.user._id,
        },
      };
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate("assignedTo", "name email phone");

    // Log status update
    await logActivity(
      "status_updated",
      `Booking status updated from "${oldBooking.status}" to "${booking.status}" for ${booking.customerName}`,
      booking._id,
      {
        oldStatus: oldBooking.status,
        newStatus: booking.status,
        customerName: booking.customerName,
        brand: booking.brand,
        updatedBy: req.user.name,
      },
      "info"
    );

    console.log(`✅ Booking status updated: ${oldBooking.status} → ${booking.status}`);

    // Send notification to customer
    sendStatusUpdateNotification(booking, oldBooking.status).catch((err) => {
      console.error("⚠️  Status notification failed:", err.message);
    });

    // Emit Socket.IO event for real-time updates
    const io = req.app.get("io");
    if (io) {
      // Emit to all connected clients
      io.emit("bookingUpdated", {
        bookingId: booking._id,
        customerName: booking.customerName,
        brand: booking.brand,
        model: booking.model,
        status: booking.status,
        oldStatus: oldBooking.status,
        assignedTo: booking.assignedTo,
        updatedAt: booking.updatedAt,
      });

      // Emit to specific user's room if they're connected
      if (oldBooking.createdBy) {
        io.to(oldBooking.createdBy.toString()).emit("bookingStatusChanged", {
          bookingId: booking._id,
          status: booking.status,
          oldStatus: oldBooking.status,
          message: message || `Status changed to ${booking.status}`,
        });
      }

      console.log("⚡ Socket events emitted: bookingUpdated, bookingStatusChanged");
    }

    res.json({ success: true, booking });
  } catch (err) {
    console.error("❌ Error updating booking status:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Send status update notification to customer
 */
async function sendStatusUpdateNotification(booking, oldStatus) {
  try {
    console.log("📢 Sending status update notification to customer");

    const statusMessage = `Hi ${booking.customerName}! 👋\n\nYour booking for ${booking.brand} ${booking.model} has been updated.\n\n📋 Status: ${oldStatus} → ${booking.status}\n📍 Address: ${booking.address}\n📅 Preferred Date: ${new Date(booking.preferredDateTime).toLocaleString()}\n\nThank you for choosing Kapoor & Sons! 🙏`;

    // Send WhatsApp notification
    if (booking.contactNumber) {
      const { sendWhatsAppMessage } = await import("../services/whatsappService.js");
      const result = await sendWhatsAppMessage(booking.contactNumber, statusMessage);

      if (result) {
        await logActivity(
          "message_sent",
          `Status update notification sent to customer ${booking.customerName}`,
          booking._id,
          { channel: "whatsapp", status: booking.status },
          "success"
        );
      }
    }
  } catch (error) {
    console.error("❌ Status notification error:", error.message);
    await logActivity(
      "notification_failed",
      `Status update notification failed for booking ${booking._id}: ${error.message}`,
      booking._id,
      { error: error.message },
      "error"
    );
  }
}

export default {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getUserBookings,
  updateBookingStatusWithNotification,
};

