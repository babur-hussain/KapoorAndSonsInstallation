import { Booking } from "../models/Booking.js";

/**
 * Get overview statistics
 * @route GET /api/v1/stats/overview
 * @access Protected (admin only)
 */
export const getOverviewStats = async (req, res) => {
  try {
    console.log("📊 Fetching overview statistics...");

    // 1. Get total bookings count
    const totalBookings = await Booking.countDocuments();

    // 2. Get bookings by status
    const statusCounts = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to object for easy access
    const statusMap = {
      Pending: 0,
      Scheduled: 0,
      Completed: 0,
      Cancelled: 0,
    };

    statusCounts.forEach((item) => {
      if (statusMap.hasOwnProperty(item._id)) {
        statusMap[item._id] = item.count;
      }
    });

    // 3. Get bookings by brand
    const bookingsByBrand = await Booking.aggregate([
      {
        $group: {
          _id: "$brand",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $project: {
          _id: 0,
          brand: "$_id",
          count: 1,
        },
      },
    ]);

    // 4. Get monthly trend (last 12 months)
    const monthlyTrend = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $let: {
              vars: {
                monthsInString: [
                  "",
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
              },
              in: {
                $arrayElemAt: ["$$monthsInString", "$_id.month"],
              },
            },
          },
          year: "$_id.year",
          count: 1,
        },
      },
    ]);

    // 5. Get recent bookings (last 5)
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("customerName brand model status createdAt")
      .lean();

    // 6. Get bookings by model (top 5)
    const bookingsByModel = await Booking.aggregate([
      {
        $group: {
          _id: {
            brand: "$brand",
            model: "$model",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
      {
        $project: {
          _id: 0,
          brand: "$_id.brand",
          model: "$_id.model",
          count: 1,
        },
      },
    ]);

    // 7. Get completion rate
    const completionRate =
      totalBookings > 0
        ? ((statusMap.Completed / totalBookings) * 100).toFixed(1)
        : 0;

    // 8. Get average bookings per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBookingsCount = await Booking.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const avgBookingsPerDay = (recentBookingsCount / 30).toFixed(1);

    const stats = {
      totalBookings,
      pending: statusMap.Pending,
      scheduled: statusMap.Scheduled,
      completed: statusMap.Completed,
      cancelled: statusMap.Cancelled,
      bookingsByBrand,
      monthlyTrend,
      recentBookings,
      bookingsByModel,
      completionRate: parseFloat(completionRate),
      avgBookingsPerDay: parseFloat(avgBookingsPerDay),
    };

    console.log("✅ Statistics fetched successfully");
    console.log(`   Total Bookings: ${totalBookings}`);
    console.log(`   Pending: ${statusMap.Pending}`);
    console.log(`   Scheduled: ${statusMap.Scheduled}`);
    console.log(`   Completed: ${statusMap.Completed}`);
    console.log(`   Cancelled: ${statusMap.Cancelled}`);

    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.error("❌ Error fetching statistics:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: err.message,
    });
  }
};

/**
 * Get daily stats for the last 7 days
 * @route GET /api/v1/stats/daily
 * @access Protected (admin only)
 */
export const getDailyStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await Booking.aggregate([
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
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
          scheduled: {
            $sum: { $cond: [{ $eq: ["$status", "Scheduled"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1,
          completed: 1,
          pending: 1,
          scheduled: 1,
          cancelled: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: dailyStats,
    });
  } catch (err) {
    console.error("❌ Error fetching daily stats:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch daily statistics",
      error: err.message,
    });
  }
};

export default {
  getOverviewStats,
  getDailyStats,
};

