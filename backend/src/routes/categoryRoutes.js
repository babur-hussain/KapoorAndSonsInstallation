import express from "express";
import { Category } from "../models/Category.js";
import { Brand } from "../models/Brand.js";

const router = express.Router();

/**
 * Get all active categories
 * @route GET /api/v1/categories
 * @access Public (no authentication required for mobile app dropdowns)
 */
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select("_id name description icon displayOrder")
      .sort({ displayOrder: 1, name: 1 });

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    console.error("❌ Error fetching categories:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: err.message,
    });
  }
});

/**
 * Get category by ID
 * @route GET /api/v1/categories/:id
 * @access Public
 */
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (err) {
    console.error("❌ Error fetching category:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: err.message,
    });
  }
});

export default router;
