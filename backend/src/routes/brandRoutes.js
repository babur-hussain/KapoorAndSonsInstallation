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
      .populate("categories", "name icon displayOrder")
      .select("_id name logo categories contactEmail whatsappNumber preferredCommunication communicationMode")
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
 * Get brands by category (now searches in categories array)
 * @route GET /api/v1/brands/category/:categoryId
 * @access Public
 */
router.get("/category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Find brands that have this category in their categories array
    const brands = await Brand.find({ 
      isActive: true,
      categories: { $in: [categoryId] }
    })
      .populate("categories", "name icon displayOrder")
      .select("_id name logo categories contactEmail whatsappNumber preferredCommunication communicationMode")
      .sort({ name: 1 });

    res.json({
      success: true,
      count: brands.length,
      data: brands,
      message: brands.length === 0 ? `No active brands found for category: ${categoryId}` : undefined,
    });
  } catch (err) {
    console.error("❌ Error fetching brands for category:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brands for category",
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
    const brand = await Brand.findById(req.params.id)
      .populate("categories", "name icon displayOrder");

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
