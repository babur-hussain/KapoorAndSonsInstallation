import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import { Booking } from "../models/Booking.js";
import { Brand } from "../models/Brand.js";
import { Category } from "../models/Category.js";
import { Model } from "../models/Model.js";
import { User } from "../models/User.js";
import { ActivityLog } from "../models/ActivityLog.js";
import EmailLog from "../models/EmailLog.js";
import { Components, componentLoader } from "./components/index.js";
import { verifyIdToken, isFirebaseEnabled } from "../config/firebaseAdmin.js";
import bcrypt from "bcryptjs";

// Register the Mongoose adapter
AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

const adminOptions = {
  resources: [
    {
      resource: Booking,
      options: {
        navigation: {
          name: "Bookings",
          icon: "Calendar",
        },
        properties: {
          customerName: {
            isTitle: true,
            position: 1,
          },
          email: {
            type: "string",
            position: 2,
          },
          contactNumber: {
            type: "string",
            position: 3,
          },
          address: {
            type: "textarea",
            position: 4,
          },
          alternateAddress: {
            type: "textarea",
            position: 5,
            description: "Alternate/Secondary address",
          },
          landmark: {
            type: "string",
            position: 6,
            description: "Landmark or location reference",
          },
          brand: {
            type: "string",
            position: 7,
          },
          model: {
            type: "string",
            position: 8,
          },
          invoiceNumber: {
            type: "string",
            position: 9,
          },
          preferredDateTime: {
            type: "datetime",
            position: 10,
          },
          status: {
            position: 11,
            availableValues: [
              { value: "Pending", label: "⏳ Pending" },
              { value: "Scheduled", label: "📅 Scheduled" },
              { value: "Completed", label: "✅ Completed" },
              { value: "Cancelled", label: "❌ Cancelled" },
            ],
          },
          assignedTo: {
            position: 12,
            reference: "User",
            isVisible: { list: true, show: true, edit: true, filter: true },
          },
          createdBy: {
            position: 13,
            reference: "User",
            isVisible: { list: false, show: true, edit: false, filter: true },
          },
          updates: {
            position: 14,
            type: "mixed",
            isVisible: { list: false, show: true, edit: false, filter: false },
          },
          createdAt: {
            isVisible: { list: true, show: true, edit: false, filter: true },
            position: 15,
          },
          updatedAt: {
            isVisible: { list: true, show: true, edit: false, filter: true },
            position: 16,
          },
        },
        listProperties: ["customerName", "email", "contactNumber", "brand", "model", "status", "assignedTo", "createdAt"],
        showProperties: [
          "customerName",
          "email",
          "contactNumber",
          "address",
          "alternateAddress",
          "landmark",
          "brand",
          "model",
          "invoiceNumber",
          "preferredDateTime",
          "status",
          "assignedTo",
          "createdBy",
          "updates",
          "createdAt",
          "updatedAt",
        ],
        sort: {
          sortBy: "createdAt",
          direction: "desc",
        },
      },
    },
    {
      resource: Brand,
      options: {
        navigation: {
          name: "Brands & Models",
          icon: "Settings",
        },
        properties: {
          name: {
            isTitle: true,
            isRequired: true,
            position: 1,
          },
          logo: {
            type: "string",
            position: 2,
            description: "URL or path to brand logo image",
          },
          contactEmail: {
            type: "string",
            position: 3,
            description: "📧 Email address for receiving booking notifications (Required if Email is selected below)",
          },
          whatsappNumber: {
            type: "string",
            position: 4,
            description: "💬 WhatsApp number with country code, e.g., +919876543210 (Required if WhatsApp is selected below)",
          },
          preferredCommunication: {
            isArray: true,
            position: 5,
            availableValues: [
              { value: "whatsapp", label: "💬 WhatsApp" },
              { value: "email", label: "📧 Email" },
            ],
            description: "Select one or both communication channels for booking notifications",
            isVisible: { list: false, edit: true, show: true, filter: true },
          },
          communicationMode: {
            position: 6,
            availableValues: [
              { value: "email", label: "📧 Email Only" },
              { value: "whatsapp", label: "�� WhatsApp Only" },
              { value: "both", label: "📧💬 Both Email & WhatsApp" },
            ],
            description: "(Auto-synced) Shows selected communication channels",
            isVisible: { list: true, edit: false, show: true, filter: true },
          },
          categories: {
            reference: "Category",
            isArray: true,
            position: 7,
            description: "Product categories this brand serves",
          },
          isActive: {
            type: "boolean",
            position: 8,
            description: "Enable/disable this brand",
          },
          createdAt: {
            isVisible: { list: true, show: true, edit: false, filter: false },
            position: 9,
          },
          updatedAt: {
            isVisible: { list: true, show: true, edit: false, filter: false },
            position: 10,
          },
        },
        listProperties: ["name", "logo", "communicationMode", "isActive"],
        showProperties: [
          "name",
          "logo",
          "contactEmail",
          "whatsappNumber",
          "preferredCommunication",
          "communicationMode",
          "categories",
          "isActive",
          "createdAt",
          "updatedAt",
        ],
        sort: {
          sortBy: "name",
          direction: "asc",
        },
        actions: {
          new: {
            after: async (response, request, context) => {
              // Emit Socket.IO event when brand is created
              const io = context.h?.app?.get("io");
              if (io && response.record) {
                const brand = response.record.params;
                io.emit("brandCreated", {
                  brandId: brand._id,
                  name: brand.name,
                  logo: brand.logo,
                  isActive: brand.isActive,
                  createdAt: brand.createdAt,
                });
                console.log("⚡ Socket event emitted: brandCreated -", brand.name);
              }
              return response;
            },
          },
          edit: {
            after: async (response, request, context) => {
              // Emit Socket.IO event when brand is updated
              const io = context.h?.app?.get("io");
              if (io && response.record) {
                const brand = response.record.params;
                io.emit("brandUpdated", {
                  brandId: brand._id,
                  name: brand.name,
                  logo: brand.logo,
                  isActive: brand.isActive,
                  updatedAt: brand.updatedAt,
                });
                console.log("⚡ Socket event emitted: brandUpdated -", brand.name);
              }
              return response;
            },
          },
          delete: {
            after: async (response, request, context) => {
              // Emit Socket.IO event when brand is deleted
              const io = context.h?.app?.get("io");
              if (io && response.record) {
                const brand = response.record.params;
                io.emit("brandDeleted", {
                  brandId: brand._id,
                  name: brand.name,
                });
                console.log("⚡ Socket event emitted: brandDeleted -", brand.name);
              }
              return response;
            },
          },
        },
      },
    },
    {
      resource: Model,
      options: {
        navigation: {
          name: "Brands & Models",
          icon: "Settings",
        },
        properties: {
          name: {
            isTitle: true,
            isRequired: true,
            position: 1,
          },
          brand: {
            position: 2,
            isRequired: true,
            reference: "Brand",
          },
          description: {
            type: "textarea",
            position: 3,
            description: "Product description",
          },
          specifications: {
            type: "textarea",
            position: 4,
            description: "Technical specifications",
          },
          isActive: {
            type: "boolean",
            position: 5,
            description: "Enable/disable this model",
          },
          createdAt: {
            isVisible: { list: true, show: true, edit: false, filter: false },
            position: 6,
          },
          updatedAt: {
            isVisible: { list: true, show: true, edit: false, filter: false },
            position: 7,
          },
        },
        listProperties: ["name", "brand", "isActive", "createdAt"],
        showProperties: [
          "name",
          "brand",
          "description",
          "specifications",
          "isActive",
          "createdAt",
          "updatedAt",
        ],
        sort: {
          sortBy: "name",
          direction: "asc",
        },
      },
    },
    {
      resource: Category,
      options: {
        navigation: {
          name: "Categories",
          icon: "Layers",
        },
        properties: {
          name: {
            isTitle: true,
            isRequired: true,
            position: 1,
          },
          description: {
            type: "textarea",
            position: 2,
            description: "Category description",
          },
          icon: {
            type: "string",
            position: 3,
            description: "URL or path to category icon image",
          },
          alternateAddress: {
            type: "textarea",
            position: 4,
            description: "Alternate/secondary address for category location",
          },
          landmark: {
            type: "string",
            position: 5,
            description: "Landmark or location reference for category",
          },
          displayOrder: {
            type: "number",
            position: 6,
            description: "Order for sorting categories (lower numbers appear first)",
          },
          isActive: {
            type: "boolean",
            position: 7,
            description: "Enable/disable this category",
          },
          createdAt: {
            isVisible: { list: true, show: true, edit: false, filter: false },
            position: 8,
          },
          updatedAt: {
            isVisible: { list: true, show: true, edit: false, filter: false },
            position: 9,
          },
        },
        listProperties: ["name", "displayOrder", "isActive", "createdAt"],
        showProperties: [
          "name",
          "description",
          "icon",
          "alternateAddress",
          "landmark",
          "displayOrder",
          "isActive",
          "createdAt",
          "updatedAt",
        ],
        sort: {
          sortBy: "displayOrder",
          direction: "asc",
        },
      },
    },
    {
      resource: Model,
      options: {
        navigation: {
          name: "User Management",
          icon: "User",
        },
        properties: {
          name: {
            isTitle: true,
            position: 1,
          },
          email: {
            type: "string",
            position: 2,
          },
          phone: {
            type: "string",
            position: 3,
          },
          role: {
            position: 4,
            availableValues: [
              { value: "customer", label: "👤 Customer" },
              { value: "staff", label: "👷 Staff" },
              { value: "admin", label: "👑 Admin" },
            ],
          },
          password: {
            isVisible: { list: false, show: false, edit: true, filter: false },
            type: "password",
            position: 5,
          },
          createdAt: {
            isVisible: { list: true, show: true, edit: false, filter: true },
            position: 6,
          },
          updatedAt: {
            isVisible: { list: true, show: true, edit: false, filter: false },
            position: 7,
          },
        },
        listProperties: ["name", "email", "role", "createdAt"],
        showProperties: ["name", "email", "phone", "role", "createdAt", "updatedAt"],
        sort: {
          sortBy: "createdAt",
          direction: "desc",
        },
        actions: {
          new: {
            isAccessible: true,
          },
          edit: {
            isAccessible: true,
          },
          delete: {
            isAccessible: true,
          },
        },
      },
    },
    {
      resource: ActivityLog,
      options: {
        navigation: {
          name: "System Logs",
          icon: "Activity",
        },
        properties: {
          type: {
            position: 1,
            availableValues: [
              { value: "booking_created", label: "📝 Booking Created" },
              { value: "booking_updated", label: "✏️ Booking Updated" },
              { value: "status_updated", label: "🔄 Status Updated" },
              { value: "message_sent", label: "💬 Message Sent" },
              { value: "notification_sent", label: "🔔 Notification Sent" },
              { value: "notification_failed", label: "❌ Notification Failed" },
              { value: "brand_created", label: "🏢 Brand Created" },
              { value: "brand_updated", label: "🏢 Brand Updated" },
            ],
          },
          message: {
            position: 2,
            type: "textarea",
          },
          severity: {
            position: 3,
            availableValues: [
              { value: "info", label: "ℹ️ Info" },
              { value: "success", label: "✅ Success" },
              { value: "warning", label: "⚠️ Warning" },
              { value: "error", label: "❌ Error" },
            ],
          },
          relatedBooking: {
            position: 4,
            isVisible: { list: true, show: true, edit: false, filter: true },
          },
          metadata: {
            position: 5,
            type: "mixed",
            isVisible: { list: false, show: true, edit: false, filter: false },
          },
          createdAt: {
            position: 6,
            isVisible: { list: true, show: true, edit: false, filter: true },
          },
          updatedAt: {
            position: 7,
            isVisible: { list: false, show: true, edit: false, filter: false },
          },
        },
        listProperties: ["type", "message", "severity", "createdAt"],
        showProperties: [
          "type",
          "message",
          "severity",
          "relatedBooking",
          "metadata",
          "createdAt",
        ],
        sort: {
          sortBy: "createdAt",
          direction: "desc",
        },
        actions: {
          new: {
            isVisible: false, // Disable manual creation
          },
          edit: {
            isVisible: false, // Disable editing
          },
          delete: {
            isAccessible: true, // Allow deletion for cleanup
          },
        },
      },
    },
    {
      resource: EmailLog,
      options: {
        navigation: {
          name: "Email Logs",
          icon: "Mail",
        },
        properties: {
          from: {
            position: 1,
            isTitle: true,
            isVisible: { list: true, show: true, edit: false, filter: true },
          },
          to: {
            position: 2,
            isVisible: { list: true, show: true, edit: false, filter: true },
          },
          subject: {
            position: 3,
            isVisible: { list: true, show: true, edit: false, filter: true },
          },
          replyText: {
            position: 4,
            type: "textarea",
            isVisible: { list: false, show: true, edit: false, filter: false },
            components: {
              list: Components.ReplyTextPreview,
            },
          },
          bookingId: {
            position: 5,
            reference: "Booking",
            isVisible: { list: true, show: true, edit: false, filter: true },
          },
          emailType: {
            position: 6,
            availableValues: [
              { value: "outgoing", label: "📤 Outgoing" },
              { value: "incoming", label: "📥 Incoming" },
              { value: "reply", label: "💬 Reply" },
            ],
            isVisible: { list: true, show: true, edit: false, filter: true },
          },
          replySent: {
            position: 7,
            isVisible: { list: true, show: true, edit: false, filter: true },
          },
          timestamp: {
            position: 8,
            isVisible: { list: true, show: true, edit: false, filter: true },
          },
          createdAt: {
            position: 9,
            isVisible: { list: false, show: true, edit: false, filter: true },
          },
          updatedAt: {
            position: 10,
            isVisible: { list: false, show: true, edit: false, filter: false },
          },
        },
        listProperties: [
          "from",
          "to",
          "subject",
          "emailType",
          "bookingId",
          "timestamp",
        ],
        showProperties: [
          "from",
          "to",
          "subject",
          "replyText",
          "bookingId",
          "emailType",
          "replySent",
          "timestamp",
          "createdAt",
        ],
        sort: {
          sortBy: "timestamp",
          direction: "desc",
        },
        actions: {
          new: {
            isVisible: false, // Disable manual creation
          },
          edit: {
            isVisible: false, // Disable editing
          },
          delete: {
            isAccessible: true, // Allow deletion for cleanup
          },
        },
      },
    },
  ],
  branding: {
    companyName: "Kapoor & Sons — Demo Booking Admin",
    softwareBrothers: false,
    logo: false,
  },
  rootPath: "/admin",
  dashboard: {
    component: Components.StatsDashboard,
  },
  componentLoader,
};

const admin = new AdminJS(adminOptions);

/**
 * AdminJS Authentication
 * Supports both traditional email/password and Firebase ID tokens
 * Only users with "admin" role can access AdminJS
 */
const authenticate = async (email, password) => {
  try {
    // Check if this is a Firebase ID token (long string without @ symbol)
    if (password && password.length > 100 && !email.includes("@")) {
      // This looks like a Firebase ID token
      if (!isFirebaseEnabled()) {
        console.warn("⚠️  Firebase authentication attempted but Firebase is not enabled");
        return null;
      }

      try {
        // Verify Firebase token
        const decodedToken = await verifyIdToken(password);
        const firebaseEmail = decodedToken.email;

        if (!firebaseEmail) {
          console.warn("⚠️  Firebase token has no email");
          return null;
        }

        // Find user by Firebase UID
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
          console.warn(`⚠️  No user found with Firebase UID: ${decodedToken.uid}`);
          return null;
        }

        // Check if user is admin
        if (user.role !== "admin") {
          console.warn(`⚠️  User ${user.email} attempted AdminJS access but is not admin (role: ${user.role})`);
          return null;
        }

        // Check if user is active
        if (!user.isActive) {
          console.warn(`⚠️  User ${user.email} attempted AdminJS access but account is inactive`);
          return null;
        }

        console.log(`✅ AdminJS Firebase login successful: ${user.email}`);
        return user;
      } catch (firebaseError) {
        console.error("❌ Firebase token verification failed:", firebaseError.message);
        return null;
      }
    }

    // Traditional email/password authentication
    if (!email || !password) {
      return null;
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      console.warn(`⚠️  AdminJS login failed: User not found (${email})`);
      return null;
    }

    // Check if user has password (Firebase users might not have password)
    if (!user.password) {
      console.warn(`⚠️  User ${email} has no password (Firebase user). Use Firebase token instead.`);
      return null;
    }

    // Check if user is admin
    if (user.role !== "admin") {
      console.warn(`⚠️  User ${email} attempted AdminJS access but is not admin (role: ${user.role})`);
      return null;
    }

    // Check if user is active
    if (!user.isActive) {
      console.warn(`⚠️  User ${email} attempted AdminJS access but account is inactive`);
      return null;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.warn(`⚠️  AdminJS login failed: Invalid password for ${email}`);
      return null;
    }

    console.log(`✅ AdminJS login successful: ${user.email}`);
    return user;
  } catch (error) {
    console.error("❌ AdminJS authentication error:", error.message);
    return null;
  }
};

// Build authenticated router
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate,
    cookiePassword: process.env.ADMIN_COOKIE_SECRET || "default-secret-change-in-production",
  },
  null,
  {
    resave: false,
    saveUninitialized: false,
    secret: process.env.ADMIN_COOKIE_SECRET || "default-secret-change-in-production",
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    },
  }
);

export { admin, adminRouter };

