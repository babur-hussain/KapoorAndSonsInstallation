import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { firebaseAuth } from "../middleware/firebaseAuth.js";

const router = express.Router();

const uploadsRoot = path.join(process.cwd(), "uploads", "invoices");
fs.mkdirSync(uploadsRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safeName = `invoice-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, safeName);
  },
});

const allowedMime = /^image\/(jpe?g|png|webp|heic|heif)$/i;
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (allowedMime.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpg, png, webp, heic) are allowed"));
    }
  },
});

router.post(
  "/invoice",
  firebaseAuth,
  upload.single("invoice"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const base = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
    const url = `${base}/uploads/invoices/${req.file.filename}`;

    return res.json({
      success: true,
      message: "Invoice uploaded",
      url,
      filename: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  }
);

router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "Invoice image must be 5MB or smaller"
      : err.message;
    return res.status(400).json({ success: false, message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message || "Upload failed" });
  }
  return res.status(500).json({ success: false, message: "Unknown upload error" });
});

export default router;
