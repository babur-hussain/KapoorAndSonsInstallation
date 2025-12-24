import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from '../../config/api';
import socketService from "../../services/socketService";
import axios from "axios";

// API base imported from config
const { width } = Dimensions.get("window");

interface Stats {
  totalBookings: number;
  pending: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  completionRate: number;
  avgBookingsPerDay: number;
  bookingsByBrand: Array<{ brand: string; count: number }>;
  monthlyTrend: Array<{ month: string; year: number; count: number }>;
  bookingsByModel: Array<{ brand: string; model: string; count: number }>;
  recentBookings: Array<{
    _id: string;
    customerName: string;
    brand: string;
    model: string;
    status: string;
    createdAt: string;
  }>;
}

const AdminStatsScreen = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to fetch statistics"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Setup Socket.IO listeners for real-time stats updates
    const handleBookingCreated = (data: any) => {
      console.log("⚡ New booking created, refreshing stats:", data);
      // Refresh stats automatically
      fetchStats();
    };

    const handleBookingUpdated = (data: any) => {
      console.log("⚡ Booking updated, refreshing stats:", data);
      // Refresh stats automatically
      fetchStats();
    };

    // Add listeners
    socketService.on("bookingCreated", handleBookingCreated);
    socketService.on("bookingUpdated", handleBookingUpdated);

    // Cleanup listeners on unmount
    return () => {
      socketService.off("bookingCreated", handleBookingCreated);
      socketService.off("bookingUpdated", handleBookingUpdated);
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No statistics available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Analytics Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Real-time booking statistics
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon="📝"
          color="#4CAF50"
          subtitle={`${stats.avgBookingsPerDay}/day avg`}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon="⏳"
          color="#FFA500"
          subtitle={`${((stats.pending / stats.totalBookings) * 100).toFixed(1)}%`}
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduled}
          icon="📅"
          color="#2196F3"
          subtitle={`${((stats.scheduled / stats.totalBookings) * 100).toFixed(1)}%`}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon="✅"
          color="#4CAF50"
          subtitle={`${stats.completionRate}% rate`}
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          icon="❌"
          color="#F44336"
          subtitle={`${((stats.cancelled / stats.totalBookings) * 100).toFixed(1)}%`}
        />
      </View>

      {/* Bookings by Brand */}
      {stats.bookingsByBrand.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Bookings by Brand</Text>
          <View style={styles.chartContainer}>
            {stats.bookingsByBrand.map((item, index) => (
              <View key={index} style={styles.barChartItem}>
                <View style={styles.barChartLabel}>
                  <Text style={styles.barChartLabelText}>{item.brand}</Text>
                  <Text style={styles.barChartValue}>{item.count}</Text>
                </View>
                <View style={styles.barChartBarContainer}>
                  <View
                    style={[
                      styles.barChartBar,
                      {
                        width: `${(item.count / stats.totalBookings) * 100}%`,
                        backgroundColor: getBarColor(index),
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Monthly Trend */}
      {stats.monthlyTrend.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Monthly Trend</Text>
          <View style={styles.chartContainer}>
            <View style={styles.lineChartContainer}>
              {stats.monthlyTrend.map((item, index) => (
                <View key={index} style={styles.lineChartItem}>
                  <View
                    style={[
                      styles.lineChartBar,
                      {
                        height: `${(item.count / Math.max(...stats.monthlyTrend.map((m) => m.count))) * 100}%`,
                      },
                    ]}
                  />
                  <Text style={styles.lineChartLabel}>{item.month}</Text>
                  <Text style={styles.lineChartValue}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Top Models */}
      {stats.bookingsByModel.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top 5 Models</Text>
          {stats.bookingsByModel.map((item, index) => (
            <View key={index} style={styles.modelItem}>
              <View style={styles.modelRank}>
                <Text style={styles.modelRankText}>{index + 1}</Text>
              </View>
              <View style={styles.modelInfo}>
                <Text style={styles.modelName}>
                  {item.brand} {item.model}
                </Text>
              </View>
              <View style={styles.modelCount}>
                <Text style={styles.modelCountText}>{item.count}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Bookings */}
      {stats.recentBookings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Recent Bookings</Text>
          {stats.recentBookings.map((booking) => (
            <View key={booking._id} style={styles.recentBookingItem}>
              <View style={styles.recentBookingInfo}>
                <Text style={styles.recentBookingName}>
                  {booking.customerName}
                </Text>
                <Text style={styles.recentBookingProduct}>
                  {booking.brand} {booking.model}
                </Text>
              </View>
              <View style={styles.recentBookingRight}>
                <StatusBadge status={booking.status} />
                <Text style={styles.recentBookingDate}>
                  {new Date(booking.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

// Stat Card Component
const StatCard = ({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
  subtitle?: string;
}) => (
  <View style={[styles.statCard, { borderColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </View>
);

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const colors: { [key: string]: string } = {
    Pending: "#FFA500",
    Scheduled: "#2196F3",
    Completed: "#4CAF50",
    Cancelled: "#F44336",
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: colors[status] || "#999" }]}>
      <Text style={styles.statusBadgeText}>{status}</Text>
    </View>
  );
};

// Helper function to get bar colors
const getBarColor = (index: number) => {
  const colors = ["#2196F3", "#4CAF50", "#FF9800", "#9C27B0", "#F44336"];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 10,
    color: "#999",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  chartContainer: {
    marginTop: 8,
  },
  barChartItem: {
    marginBottom: 16,
  },
  barChartLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  barChartLabelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  barChartValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2196F3",
  },
  barChartBarContainer: {
    height: 24,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  barChartBar: {
    height: "100%",
    borderRadius: 4,
  },
  lineChartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 150,
    paddingBottom: 30,
  },
  lineChartItem: {
    alignItems: "center",
    flex: 1,
  },
  lineChartBar: {
    width: 30,
    backgroundColor: "#4CAF50",
    borderRadius: 4,
    minHeight: 20,
  },
  lineChartLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  lineChartValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2,
  },
  modelItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 8,
  },
  modelRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modelRankText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  modelCount: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: "center",
  },
  modelCountText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  recentBookingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 8,
  },
  recentBookingInfo: {
    flex: 1,
  },
  recentBookingName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  recentBookingProduct: {
    fontSize: 12,
    color: "#666",
  },
  recentBookingRight: {
    alignItems: "flex-end",
  },
  recentBookingDate: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 80,
    alignItems: "center",
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default AdminStatsScreen;

