import express from "express";
import { Brand } from "../models/Brand.js";

const router = express.Router();

/**
 * Get all active brands
 * @route GET /api/v1/brands
 * @access Public (no authentication required for mobile app dropdowns)
 */
router.get("/", async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true })
      .select("name logo")
      .sort({ name: 1 });

    res.json({
      success: true,
      count: brands.length,
      data: brands,
    });
  } catch (err) {
    console.error("❌ Error fetching brands:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brands",
      error: err.message,
    });
  }
});

/**
 * Get brand by ID
 * @route GET /api/v1/brands/:id
 * @access Public
 */
router.get("/:id", async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.json({
      success: true,
      data: brand,
    });
  } catch (err) {
    console.error("❌ Error fetching brand:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brand",
      error: err.message,
    });
  }
});

export default router;

