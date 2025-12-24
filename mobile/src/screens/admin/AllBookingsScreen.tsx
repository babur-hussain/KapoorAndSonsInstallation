import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from '../../config/api';
import socketService from "../../services/socketService";
import axios from "axios";

// API base imported from config

interface Booking {
  _id: string;
  customerName: string;
  email: string;
  contactNumber: string;
  address: string;
  brand: string;
  model: string;
  serviceType?: string;
  invoiceNumber: string;
  preferredDateTime: string;
  status: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

const AllBookingsScreen = ({ navigation }: any) => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle both array response and object with data property
      const bookingsData = Array.isArray(response.data) 
        ? response.data 
        : response.data.data || [];
      
      setBookings(bookingsData);
    } catch (error: any) {
      console.error("Error fetching all bookings:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to fetch bookings"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Setup Socket.IO listeners for real-time updates
    const handleBookingCreated = (data: any) => {
      console.log("⚡ New booking created:", data);
      fetchBookings();
    };

    const handleBookingUpdated = (data: any) => {
      console.log("⚡ Booking updated:", data);
      fetchBookings();
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
    fetchBookings();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "#FFA500";
      case "Confirmed":
      case "Scheduled":
        return "#2196F3";
      case "In Progress":
        return "#9C27B0";
      case "Completed":
        return "#4CAF50";
      case "Cancelled":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return "⏳";
      case "Confirmed":
      case "Scheduled":
        return "📅";
      case "In Progress":
        return "🔄";
      case "Completed":
        return "✅";
      case "Cancelled":
        return "❌";
      default:
        return "📋";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const isExpanded = expandedId === item._id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => toggleExpand(item._id)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.brandText}>
              {item.brand} {item.model}
            </Text>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusIcon(item.status)} {item.status}
            </Text>
          </View>
        </View>

        {/* Collapsed View */}
        {!isExpanded && (
          <View style={styles.collapsedInfo}>
            <Text style={styles.infoText} numberOfLines={1}>
              📞 {item.contactNumber}
            </Text>
            <Text style={styles.infoText} numberOfLines={1}>
              📍 {item.address}
            </Text>
            <Text style={styles.expandHint}>Tap to view details</Text>
          </View>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <View style={styles.expandedInfo}>
            {/* Contact Details */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Contact Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{item.contactNumber}</Text>
              </View>

              {item.email && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{item.email}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{item.address}</Text>
              </View>
            </View>

            {/* Booking Details */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Booking Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Invoice Number:</Text>
                <Text style={styles.detailValue}>{item.invoiceNumber}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service Type:</Text>
                <Text style={[styles.detailValue, styles.serviceTypeHighlight]}>{item.serviceType || "N/A"}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Preferred Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(item.preferredDateTime)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(item.updatedAt)}
                </Text>
              </View>
            </View>

            {/* Assigned Staff */}
            {item.assignedTo && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Assigned Staff</Text>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{item.assignedTo.name}</Text>
                  <Text style={styles.staffContact}>
                    📧 {item.assignedTo.email}
                  </Text>
                  <Text style={styles.staffContact}>
                    📞 {item.assignedTo.phone}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#dc3545" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No Bookings Found</Text>
        <Text style={styles.emptyText}>
          There are no bookings in the system yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Bookings</Text>
        <Text style={styles.headerSubtitle}>{bookings.length} total</Text>
      </View>
      <FlatList
        data={bookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#dc3545",
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  brandText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  collapsedInfo: {
    padding: 16,
    paddingTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  expandHint: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginTop: 8,
  },
  expandedInfo: {
    padding: 16,
    paddingTop: 12,
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    width: 120,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  staffInfo: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  staffName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  staffContact: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  serviceTypeHighlight: {
    color: "#ff0000",
    fontWeight: "bold",
  },
});

export default AllBookingsScreen;

