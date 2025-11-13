import express from "express";
import { Model } from "../models/Model.js";

const router = express.Router();

/**
 * Get all active models (optionally filtered by brand)
 * @route GET /api/v1/models?brand=brandId
 * @access Public (no authentication required for mobile app dropdowns)
 */
router.get("/", async (req, res) => {
  try {
    const { brand } = req.query;

    // Build query
    const query = { isActive: true };
    if (brand) {
      query.brand = brand;
    }

    const models = await Model.find(query)
      .populate("brand", "name logo")
      .select("name brand description specifications")
      .sort({ name: 1 });

    res.json({
      success: true,
      count: models.length,
      data: models,
    });
  } catch (err) {
    console.error("❌ Error fetching models:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch models",
      error: err.message,
    });
  }
});

/**
 * Get models by brand name (for backward compatibility with existing booking form)
 * @route GET /api/v1/models/by-brand/:brandName
 * @access Public
 */
router.get("/by-brand/:brandName", async (req, res) => {
  try {
    const { brandName } = req.params;

    // First find the brand by name
    const { Brand } = await import("../models/Brand.js");
    const brand = await Brand.findOne({ name: brandName, isActive: true });

    if (!brand) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: `No active brand found with name: ${brandName}`,
      });
    }

    // Then find models for that brand
    const models = await Model.find({ brand: brand._id, isActive: true })
      .select("name description specifications")
      .sort({ name: 1 });

    res.json({
      success: true,
      count: models.length,
      data: models,
      brand: {
        id: brand._id,
        name: brand.name,
        logo: brand.logo,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching models by brand:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch models",
      error: err.message,
    });
  }
});

/**
 * Get model by ID
 * @route GET /api/v1/models/:id
 * @access Public
 */
router.get("/:id", async (req, res) => {
  try {
    const model = await Model.findById(req.params.id).populate("brand", "name logo");

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    res.json({
      success: true,
      data: model,
    });
  } catch (err) {
    console.error("❌ Error fetching model:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch model",
      error: err.message,
    });
  }
});

export default router;

