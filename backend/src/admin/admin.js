import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import { Booking } from "../models/Booking.js";
import { Brand } from "../models/Brand.js";

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
          contactNumber: {
            type: "string",
            position: 2,
          },
          address: {
            type: "textarea",
            position: 3,
          },
          brand: {
            type: "string",
            position: 4,
          },
          model: {
            type: "string",
            position: 5,
          },
          invoiceNumber: {
            type: "string",
            position: 6,
          },
          preferredDateTime: {
            type: "datetime",
            position: 7,
          },
          status: {
            position: 8,
            availableValues: [
              { value: "Pending", label: "⏳ Pending" },
              { value: "Confirmed", label: "✅ Confirmed" },
              { value: "In Progress", label: "🔄 In Progress" },
              { value: "Completed", label: "✔️ Completed" },
              { value: "Cancelled", label: "❌ Cancelled" },
            ],
          },
          createdAt: {
            isVisible: { list: true, show: true, edit: false, filter: true },
            position: 9,
          },
          updatedAt: {
            isVisible: { list: true, show: true, edit: false, filter: true },
            position: 10,
          },
        },
        listProperties: ["customerName", "contactNumber", "brand", "model", "status", "createdAt"],
        showProperties: [
          "customerName",
          "contactNumber",
          "address",
          "brand",
          "model",
          "invoiceNumber",
          "preferredDateTime",
          "status",
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
          name: "Brand Settings",
          icon: "Settings",
        },
        properties: {
          name: {
            isTitle: true,
            isRequired: true,
            position: 1,
          },
          contactEmail: {
            type: "string",
            position: 2,
            description: "Email address for receiving booking notifications",
          },
          whatsappNumber: {
            type: "string",
            position: 3,
            description: "WhatsApp number with country code (e.g., +919876543210)",
          },
          communicationMode: {
            position: 4,
            availableValues: [
              { value: "email", label: "📧 Email Only" },
              { value: "whatsapp", label: "💬 WhatsApp Only" },
              { value: "both", label: "📧💬 Both Email & WhatsApp" },
            ],
            description: "Preferred method for receiving booking notifications",
          },
          isActive: {
            type: "boolean",
            position: 5,
            description: "Enable/disable notifications for this brand",
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
        listProperties: ["name", "communicationMode", "contactEmail", "whatsappNumber", "isActive"],
        showProperties: [
          "name",
          "contactEmail",
          "whatsappNumber",
          "communicationMode",
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
  ],
  branding: {
    companyName: "Kapoor & Sons — Demo Booking Admin",
    softwareBrothers: false,
    logo: false,
  },
  rootPath: "/admin",
};

const admin = new AdminJS(adminOptions);
const adminRouter = AdminJSExpress.buildRouter(admin);

export { admin, adminRouter };

