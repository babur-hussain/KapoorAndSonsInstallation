import express from "express";
import { Booking } from "../models/Booking.js";
import { Brand } from "../models/Brand.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { User } from "../models/User.js";
import { authorize } from "../middleware/authMiddleware.js";
import { firebaseAuth } from "../middleware/firebaseAuth.js";

const router = express.Router();

/**
 * GET /api/v1/admin/stats
 * Returns comprehensive analytics data for the dashboard
 * Requires: Admin role
 */
router.get("/", firebaseAuth, authorize("admin"), async (req, res) => {
  try {
    // Basic booking counts
    const total = await Booking.countDocuments();
    const pending = await Booking.countDocuments({ status: "Pending" });
    const confirmed = await Booking.countDocuments({ status: "Confirmed" });
    const inProgress = await Booking.countDocuments({ status: "In Progress" });
    const completed = await Booking.countDocuments({ status: "Completed" });
    const cancelled = await Booking.countDocuments({ status: "Cancelled" });

    // Brand-wise breakdown
    const brandSummary = await Booking.aggregate([
      {
        $group: {
          _id: "$brand",
          count: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Status distribution
    const statusDistribution = [
      { status: "Pending", count: pending },
      { status: "Confirmed", count: confirmed },
      { status: "In Progress", count: inProgress },
      { status: "Completed", count: completed },
      { status: "Cancelled", count: cancelled },
    ];

    // Recent bookings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentBookings = await Booking.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Bookings by date (last 7 days)
    const bookingsByDate = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Activity log summary
    const totalActivities = await ActivityLog.countDocuments();
    const recentActivities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("relatedBooking", "customerName brand model")
      .lean();

    // Activity type breakdown
    const activityTypeBreakdown = await ActivityLog.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Brand count
    const totalBrands = await Brand.countDocuments();
    const activeBrands = await Brand.countDocuments({ isActive: true });

    // User count
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const customerCount = await User.countDocuments({ role: "customer" });
    const staffCount = await User.countDocuments({ role: "staff" });
    const adminCount = await User.countDocuments({ role: "admin" });

    // Response time (average time from booking to completion)
    const completedBookingsWithTime = await Booking.aggregate([
      {
        $match: { status: "Completed" },
      },
      {
        $project: {
          duration: {
            $subtract: ["$updatedAt", "$createdAt"],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$duration" },
        },
      },
    ]);

    const avgResponseTime = completedBookingsWithTime[0]?.avgDuration || 0;
    const avgResponseHours = Math.round(avgResponseTime / (1000 * 60 * 60));

    res.json({
      bookings: {
        total,
        pending,
        confirmed,
        inProgress,
        completed,
        cancelled,
        recent: recentBookings,
      },
      statusDistribution,
      brandSummary,
      bookingsByDate,
      activities: {
        total: totalActivities,
        recent: recentActivities,
        typeBreakdown: activityTypeBreakdown,
      },
      brands: {
        total: totalBrands,
        active: activeBrands,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        customers: customerCount,
        staff: staffCount,
        admins: adminCount,
      },
      performance: {
        avgResponseHours,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching admin stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/admin/stats/activities
 * Returns recent activity logs with pagination
 * Requires: Admin role
 */
router.get("/activities", firebaseAuth, authorize("admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("relatedBooking", "customerName brand model")
      .lean();

    const total = await ActivityLog.countDocuments();

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching activities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
      error: error.message,
    });
  }
});

export default router;

