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

interface CustomerDashboardProps {
  navigation: any;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ navigation }) => {
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
            <Text style={styles.roleText}>Customer</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={[styles.actionCard, styles.primaryCard]}
          onPress={() => navigation.navigate("BookingForm")}
        >
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={[styles.actionTitle, { color: "#fff" }]}>Create New Booking</Text>
          <Text style={[styles.actionDescription, { color: "#e6f2ff" }]}>
            Book a demo installation for your product
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate("MyBookings")}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionTitle}>My Bookings</Text>
          <Text style={styles.actionDescription}>
            View and track your booking history
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
        <Text style={styles.infoTitle}>About Customer Access</Text>
        <Text style={styles.infoText}>
          As a customer, you can:
        </Text>
        <Text style={styles.infoBullet}>• Create new demo bookings</Text>
        <Text style={styles.infoBullet}>• View your booking history</Text>
        <Text style={styles.infoBullet}>• Track booking status</Text>
        <Text style={styles.infoBullet}>• Update your profile</Text>
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
    backgroundColor: "#007AFF",
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
  section: {
    padding: 20,
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
    backgroundColor: "#007AFF",
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
    backgroundColor: "#e7f3ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#b3d9ff",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#004085",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#004085",
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 14,
    color: "#004085",
    marginLeft: 8,
    marginBottom: 4,
  },
});

// Override styles for primary card text
StyleSheet.create({
  primaryCard: {
    ...styles.actionCard,
    backgroundColor: "#007AFF",
  },
});

export default CustomerDashboard;

