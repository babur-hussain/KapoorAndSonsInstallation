import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import { Booking } from "../models/Booking.js";

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
        properties: {
          customerName: { isTitle: true },
          contactNumber: { type: "string" },
          address: { type: "textarea" },
          brand: { type: "string" },
          model: { type: "string" },
          invoiceNumber: { type: "string" },
          preferredDateTime: { type: "datetime" },
          status: {
            availableValues: [
              { value: "Pending", label: "Pending" },
              { value: "Confirmed", label: "Confirmed" },
              { value: "Completed", label: "Completed" },
              { value: "Cancelled", label: "Cancelled" },
            ],
          },
          createdAt: { isVisible: { list: true, show: true, edit: false, filter: true } },
          updatedAt: { isVisible: { list: true, show: true, edit: false, filter: true } },
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
      },
    },
  ],
  branding: {
    companyName: "Kapoor & Sons Admin",
    softwareBrothers: false,
    logo: false,
  },
  rootPath: "/admin",
};

const admin = new AdminJS(adminOptions);
const adminRouter = AdminJSExpress.buildRouter(admin);

export { admin, adminRouter };

