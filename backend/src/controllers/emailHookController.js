import EmailLog from "../models/EmailLog.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import { sendPushNotification } from "../services/pushNotificationService.js";

/**
 * Email Hook Controller
 * Handles incoming email webhooks from n8n automation workflow
 */

/**
 * Receive and log email hook from n8n
 * @route POST /api/email-hook
 * @access Public (called by n8n)
 */
export const receiveEmailHook = async (req, res) => {
  try {
    // Handle both array and object format from n8n
    let data = req.body;
    if (Array.isArray(req.body) && req.body.length > 0) {
      data = req.body[0]; // Extract first item if it's an array
    }
    
    // Helper function to clean n8n empty values (converts "=" to null/undefined)
    const cleanValue = (val) => {
      if (val === null || val === undefined || val === "" || val === "=") {
        return undefined;
      }
      return val;
    };
    
    const from = cleanValue(data.from);
    const to = cleanValue(data.to);
    const subject = cleanValue(data.subject);
    const replyText = cleanValue(data.replyText);
    const replySent = data.replySent;
    const timestamp = cleanValue(data.timestamp);
    const bookingId = cleanValue(data.bookingId);
    const messageId = cleanValue(data.messageId);
    const inReplyTo = cleanValue(data.inReplyTo);
    const references = cleanValue(data.references);

    // Log incoming webhook data in a clean formatted way
    console.log("\n" + "=".repeat(60));
    console.log("📧 EMAIL HOOK RECEIVED");
    console.log("=".repeat(60));
    console.log("From:        ", from || "N/A");
    console.log("To:          ", to || "N/A");
    console.log("Subject:     ", subject || "N/A");
    console.log("Reply Text:  ", replyText ? replyText.substring(0, 100) + "..." : "N/A");
    console.log("Reply Sent:  ", replySent !== undefined ? replySent : "N/A");
    console.log("Booking ID:  ", bookingId || "N/A");
    console.log("Message-ID:  ", messageId || "N/A");
    console.log("In-Reply-To: ", inReplyTo || "N/A");
    console.log("Timestamp:   ", timestamp || new Date().toISOString());
    console.log("=".repeat(60) + "\n");

    // Validate required fields
    if (!from || !subject) {
      console.error("❌ Validation failed: Missing required fields (from or subject)");
      return res.status(400).json({
        success: false,
        message: "Invalid payload: 'from' and 'subject' are required fields",
      });
    }

    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(from)) {
      console.error("❌ Validation failed: Invalid email format");
      return res.status(400).json({
        success: false,
        message: "Invalid payload: 'from' must be a valid email address",
      });
    }

    // Try to match email with a booking
    let matchedBookingId = bookingId;

    // Method 1: Try to find by In-Reply-To header (most reliable for email threading)
    if (!matchedBookingId && inReplyTo) {
      console.log("🔍 Searching by In-Reply-To header:", inReplyTo);
      
      // Try to find the original email by Message-ID
      const originalEmail = await EmailLog.findOne({ 
        messageId: inReplyTo,
        bookingId: { $exists: true, $ne: null }
      });
      
      if (originalEmail && originalEmail.bookingId) {
        matchedBookingId = originalEmail.bookingId.toString();
        console.log("✅ Matched booking via email thread (In-Reply-To):", matchedBookingId);
      }
    }

    // Method 2: Try to extract booking ID from subject line
    if (!matchedBookingId) {
      // Supports multiple patterns:
      // - "Booking #A3K9P2" (6 chars)
      // - "Booking #67890abcdef12345" (24 chars MongoDB ID)
      // - "Re: New Request - #A3K9P2"
      // - "Booking ID: A3K9P2"
      const bookingIdMatch = subject.match(/#([A-Z0-9]{6})|#([a-f0-9]{24})|booking[:\s]+([A-Z0-9]{6})|booking[:\s]+([a-f0-9]{24})/i);

      if (bookingIdMatch) {
        matchedBookingId = bookingIdMatch[1] || bookingIdMatch[2] || bookingIdMatch[3] || bookingIdMatch[4];
        console.log("📌 Extracted booking ID from subject:", matchedBookingId);
      }
    }

    // Method 3: Try to extract from email body (replyText)
    if (!matchedBookingId && replyText) {
      const bodyIdMatch = replyText.match(/#([A-Z0-9]{6})|#([a-f0-9]{24})|booking[:\s]+([A-Z0-9]{6})|booking[:\s]+([a-f0-9]{24})/i);
      if (bodyIdMatch) {
        matchedBookingId = bodyIdMatch[1] || bodyIdMatch[2] || bodyIdMatch[3] || bodyIdMatch[4];
        console.log("📌 Extracted booking ID from email body:", matchedBookingId);
      }
    }

    // Method 4: Match by sender email with recent bookings (last resort)
    if (!matchedBookingId) {
      console.log("⚠️  No booking ID found, attempting to match by sender email...");
      
      // Find most recent booking from this email sender (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentBooking = await Booking.findOne({
        email: from.trim(),
        createdAt: { $gte: thirtyDaysAgo }
      }).sort({ createdAt: -1 });

      if (recentBooking) {
        matchedBookingId = recentBooking._id.toString();
        console.log("📧 Matched by email to recent booking:", matchedBookingId);
        console.log("   Customer:", recentBooking.customerName);
        console.log("   Created:", recentBooking.createdAt.toISOString());
      } else {
        console.log("⚠️  No recent bookings found for email:", from);
      }
    }

    // Validate and verify booking exists
    let booking = null;
    if (matchedBookingId) {
      // Try to find by 6-character bookingId first, then by MongoDB _id
      if (matchedBookingId.length === 6) {
        booking = await Booking.findOne({ bookingId: matchedBookingId });
      } else if (mongoose.Types.ObjectId.isValid(matchedBookingId)) {
        booking = await Booking.findById(matchedBookingId);
      }

      if (booking) {
        console.log("✅ Matched with booking:", booking._id);
        console.log("   Customer:", booking.customerName);
        console.log("   Brand:", booking.brand);
        console.log("   Model:", booking.model);
        // Always use MongoDB _id for storage and socket events
        matchedBookingId = booking._id.toString();
      } else {
        console.log("⚠️  Booking ID provided but not found in database");
        matchedBookingId = null;
      }
    }

    // Determine email type
    let emailType = "incoming";
    if (replySent === true) {
      emailType = "outgoing";
    } else if (matchedBookingId && replyText) {
      emailType = "reply";
    }

    // Parse timestamp safely
    let parsedTimestamp = new Date();
    if (timestamp) {
      const dateAttempt = new Date(timestamp);
      if (!isNaN(dateAttempt.getTime())) {
        parsedTimestamp = dateAttempt;
      }
    }

    // Save to database
    const emailLog = new EmailLog({
      from: from.trim(),
      to: to ? to.trim() : undefined,
      subject: subject.trim(),
      replyText: replyText ? replyText.trim() : "",
      bookingId: matchedBookingId || undefined,
      replySent: replySent === true,
      emailType: emailType,
      timestamp: parsedTimestamp,
      messageId: messageId ? messageId.trim() : undefined,
      inReplyTo: inReplyTo ? inReplyTo.trim() : undefined,
      references: references ? references.trim() : undefined,
    });

    await emailLog.save();

    console.log("✅ Email log saved to database with ID:", emailLog._id);
    console.log("   Email Type:", emailType);
    console.log("   Linked to Booking:", matchedBookingId ? "Yes" : "No");

    // Emit Socket.IO event for real-time updates (if booking is matched)
    if (matchedBookingId && emailType === "reply") {
      try {
        // Get io instance from app
        const io = req.app.get("io");
        if (io) {
          io.emit("emailReplyReceived", {
            emailLogId: emailLog._id,
            bookingId: matchedBookingId,
            from: emailLog.from,
            subject: emailLog.subject,
            replyText: emailLog.replyText,
            timestamp: emailLog.timestamp,
          });
          console.log("⚡ Socket.IO event emitted: emailReplyReceived");
        }

        // Send push notification to the customer
        if (booking && booking.createdBy) {
          const customer = await User.findById(booking.createdBy);
          if (customer && customer.pushToken) {
            try {
              await sendPushNotification(
                customer.pushToken,
                'New Response Received',
                `${booking.brand} ${booking.model} - Response from ${emailLog.from}`,
                {
                  bookingId: matchedBookingId,
                  emailLogId: emailLog._id.toString(),
                  type: 'email_reply',
                }
              );
              console.log(`📱 Push notification sent to ${customer.name}`);
            } catch (pushError) {
              console.error("⚠️  Push notification failed:", pushError.message);
            }
          } else {
            console.log("⚠️  No push token found for customer");
          }
        }
      } catch (socketError) {
        console.error("⚠️  Socket.IO emit failed:", socketError.message);
      }
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Email hook received and logged successfully",
      data: {
        id: emailLog._id,
        from: emailLog.from,
        subject: emailLog.subject,
        replyText: emailLog.replyText,
        bookingId: matchedBookingId,
        emailType: emailType,
        timestamp: emailLog.timestamp,
      },
    });
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ EMAIL HOOK ERROR");
    console.error("=".repeat(60));
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("=".repeat(60) + "\n");

    return res.status(500).json({
      success: false,
      message: "Internal server error while processing email hook",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get email logs with pagination and filters
 * @route GET /api/email-hook/logs
 * @access Public (for debugging and monitoring)
 */
export const getEmailLogs = async (req, res) => {
  try {
    const { limit = 50, page = 1, from, replySent, bookingId } = req.query;

    // Build query filter
    const filter = {};
    if (from) filter.from = { $regex: from, $options: "i" };
    if (replySent !== undefined) filter.replySent = replySent === "true";
    if (bookingId) filter.bookingId = bookingId;

    // Fetch logs with pagination
    const logs = await EmailLog.find(filter)
      .populate("bookingId", "customerName brand model status")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await EmailLog.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching email logs:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching email logs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get email log statistics
 * @route GET /api/email-hook/stats
 * @access Public (for monitoring)
 */
export const getEmailStats = async (req, res) => {
  try {
    const totalLogs = await EmailLog.countDocuments();
    const repliesSent = await EmailLog.countDocuments({ replySent: true });
    const repliesPending = await EmailLog.countDocuments({ replySent: false });

    // Get logs from last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = await EmailLog.countDocuments({
      timestamp: { $gte: last24Hours },
    });

    // Get email type breakdown
    const outgoingEmails = await EmailLog.countDocuments({ emailType: "outgoing" });
    const incomingEmails = await EmailLog.countDocuments({ emailType: "incoming" });
    const replyEmails = await EmailLog.countDocuments({ emailType: "reply" });

    return res.status(200).json({
      success: true,
      stats: {
        totalLogs,
        repliesSent,
        repliesPending,
        recentLogs24h: recentLogs,
        emailTypes: {
          outgoing: outgoingEmails,
          incoming: incomingEmails,
          reply: replyEmails,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching email stats:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching email statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

