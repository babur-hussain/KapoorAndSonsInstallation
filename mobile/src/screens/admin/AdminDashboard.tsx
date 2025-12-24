import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from '../../config/api';
import axios from "axios";
import socketService from "../../services/socketService";

// API base imported from config

interface AdminDashboardProps {
  navigation: any;
}

interface DashboardStats {
  totalBookings: number;
  totalUsers: number;
  pending: number;
  confirmed: number;
  completed: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigation }) => {
  const { user, logout, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalUsers: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setStats({
          totalBookings: response.data.bookings.total || 0,
          totalUsers: response.data.users?.total || 0,
          pending: response.data.bookings.pending || 0,
          confirmed: response.data.bookings.confirmed || 0,
          completed: response.data.bookings.completed || 0,
        });
      }
    } catch (error: any) {
      console.error("Error fetching admin stats:", error);
      // Don't show alert on initial load, just log the error
      if (!loading) {
        Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to fetch statistics"
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Setup Socket.IO listeners for real-time updates
    const handleBookingCreated = () => {
      console.log("⚡ New booking created, refreshing stats");
      fetchStats();
    };

    const handleBookingUpdated = () => {
      console.log("⚡ Booking updated, refreshing stats");
      fetchStats();
    };

    socketService.on("bookingCreated", handleBookingCreated);
    socketService.on("bookingUpdated", handleBookingUpdated);

    return () => {
      socketService.off("bookingCreated", handleBookingCreated);
      socketService.off("bookingUpdated", handleBookingUpdated);
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc3545" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Panel</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Administrator</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalBookings}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Quick Stats Row */}
      <View style={styles.quickStatsContainer}>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>{stats.confirmed}</Text>
          <Text style={styles.quickStatLabel}>Confirmed</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>{stats.completed}</Text>
          <Text style={styles.quickStatLabel}>Completed</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>{stats.totalUsers}</Text>
          <Text style={styles.quickStatLabel}>Users</Text>
        </View>
      </View>

      {/* Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Management</Text>
        
        <TouchableOpacity
          style={[styles.actionCard, styles.primaryCard]}
          onPress={() => navigation.navigate("AllBookings")}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionTitle}>All Bookings</Text>
          <Text style={styles.actionDescription}>
            View and manage all customer bookings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => Alert.alert("Coming Soon", "User Management feature will be available soon")}
        >
          <Text style={styles.actionIcon}>👥</Text>
          <Text style={styles.actionTitle}>User Management</Text>
          <Text style={styles.actionDescription}>
            Manage customers, staff, and admins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => Alert.alert("Coming Soon", "Analytics feature will be available soon")}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionTitle}>Analytics</Text>
          <Text style={styles.actionDescription}>
            View system statistics and reports
          </Text>
        </TouchableOpacity>
      </View>

      {/* System Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System</Text>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => Alert.alert("Coming Soon", "System Settings feature will be available soon")}
        >
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionTitle}>System Settings</Text>
          <Text style={styles.actionDescription}>
            Configure app settings and preferences
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => Alert.alert("Coming Soon", "Activity Logs feature will be available soon")}
        >
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionTitle}>Activity Logs</Text>
          <Text style={styles.actionDescription}>
            View system activity and audit logs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.actionIcon}>👤</Text>
          <Text style={styles.actionTitle}>My Profile</Text>
          <Text style={styles.actionDescription}>
            Update your personal information
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>About Admin Access</Text>
        <Text style={styles.infoText}>
          As an administrator, you have full access to:
        </Text>
        <Text style={styles.infoBullet}>• All bookings and customer data</Text>
        <Text style={styles.infoBullet}>• User management (create, edit, delete)</Text>
        <Text style={styles.infoBullet}>• System analytics and reports</Text>
        <Text style={styles.infoBullet}>• System settings and configuration</Text>
        <Text style={styles.infoBullet}>• Activity logs and audit trails</Text>
        <Text style={styles.infoNote}>
          Note: Some features are under development
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
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
  header: {
    backgroundColor: "#dc3545",
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 20,
    paddingBottom: 10,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#dc3545",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  quickStatsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  quickStatLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryCard: {
    backgroundColor: "#dc3545",
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: "#666",
  },
  infoSection: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: "#f8d7da",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f5c6cb",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#721c24",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#721c24",
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 14,
    color: "#721c24",
    marginLeft: 8,
    marginBottom: 4,
  },
  infoNote: {
    fontSize: 12,
    color: "#721c24",
    fontStyle: "italic",
    marginTop: 8,
  },
});

export default AdminDashboard;

