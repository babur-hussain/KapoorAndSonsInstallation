import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

interface StaffDashboardProps {
  navigation: any;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ navigation }) => {
  const { user, logout } = useAuth();

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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Staff / Installer</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Assigned Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={[styles.actionCard, styles.primaryCard]}
          onPress={() => Alert.alert("Coming Soon", "My Assignments feature will be available soon")}
        >
          <Text style={styles.actionIcon}>📦</Text>
          <Text style={styles.actionTitle}>My Assignments</Text>
          <Text style={styles.actionDescription}>
            View demo installations assigned to you
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate("AllBookings")}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionTitle}>All Bookings</Text>
          <Text style={styles.actionDescription}>
            View all customer bookings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => Alert.alert("Coming Soon", "Update Status feature will be available soon")}
        >
          <Text style={styles.actionIcon}>✅</Text>
          <Text style={styles.actionTitle}>Update Status</Text>
          <Text style={styles.actionDescription}>
            Mark installations as complete
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
        <Text style={styles.infoTitle}>About Staff Access</Text>
        <Text style={styles.infoText}>
          As a staff member, you can:
        </Text>
        <Text style={styles.infoBullet}>• View assigned demo installations</Text>
        <Text style={styles.infoBullet}>• Update installation status</Text>
        <Text style={styles.infoBullet}>• View all customer bookings</Text>
        <Text style={styles.infoBullet}>• Manage your schedule</Text>
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
  header: {
    backgroundColor: "#28a745",
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
    color: "#28a745",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
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
    backgroundColor: "#28a745",
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
    backgroundColor: "#d4edda",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c3e6cb",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#155724",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#155724",
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 14,
    color: "#155724",
    marginLeft: 8,
    marginBottom: 4,
  },
  infoNote: {
    fontSize: 12,
    color: "#155724",
    fontStyle: "italic",
    marginTop: 8,
  },
});

export default StaffDashboard;

