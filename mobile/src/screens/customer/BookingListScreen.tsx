import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from '../../config/api';
import { getBookingEmails } from '../../services/api';
import socketService from "../../services/socketService";
import axios from "axios";

// API base imported from config

interface Booking {
  _id: string;
  bookingId?: string;
  customerName: string;
  contactNumber: string;
  alternateContactNumber?: string;
  address: string;
  alternateAddress?: string;
  landmark?: string;
  category?: {
    _id: string;
    name: string;
    icon?: string;
  };
  categoryName?: string;
  brand: string;
  model: string;
  invoiceNumber: string;
  preferredDateTime: string;
  status: "Pending" | "Scheduled" | "Completed" | "Cancelled";
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  updates?: Array<{
    message: string;
    timestamp: string;
    updatedBy?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const BookingListScreen = ({ navigation }: any) => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookingEmails, setBookingEmails] = useState<{ [key: string]: any[] }>({});
  const [emailsLoading, setEmailsLoading] = useState<{ [key: string]: boolean }>({});
  const fetchBookingEmails = async (bookingId: string) => {
    setEmailsLoading(prev => ({ ...prev, [bookingId]: true }));
    try {
      const emails = await getBookingEmails(bookingId, token);
      setBookingEmails(prev => ({ ...prev, [bookingId]: emails }));
    } catch (err) {
      setBookingEmails(prev => ({ ...prev, [bookingId]: [] }));
    } finally {
      setEmailsLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bookings/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
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
      // Refresh bookings list
      fetchBookings();
    };

    const handleBookingUpdated = (data: any) => {
      console.log("⚡ Booking updated:", data);
      // Update specific booking in the list
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking._id === data.bookingId
            ? { ...booking, status: data.status, updatedAt: data.updatedAt }
            : booking
        )
      );
    };

    const handleBookingStatusChanged = (data: any) => {
      console.log("⚡ Booking status changed:", data);
      // Show notification to user
      Alert.alert(
        "Booking Updated",
        data.message || `Your booking status has been updated to ${data.status}`,
        [{ text: "OK", onPress: () => fetchBookings() }]
      );
    };

    // Add listeners
    socketService.on("bookingCreated", handleBookingCreated);
    socketService.on("bookingUpdated", handleBookingUpdated);
    socketService.on("bookingStatusChanged", handleBookingStatusChanged);

    // Cleanup listeners on unmount
    return () => {
      socketService.off("bookingCreated", handleBookingCreated);
      socketService.off("bookingUpdated", handleBookingUpdated);
      socketService.off("bookingStatusChanged", handleBookingStatusChanged);
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    if (expandedId !== id) fetchBookingEmails(id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "#FFA500"; // Orange
      case "Scheduled":
        return "#2196F3"; // Blue
      case "Completed":
        return "#4CAF50"; // Green
      case "Cancelled":
        return "#F44336"; // Red
      default:
        return "#757575"; // Gray
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return "⏳";
      case "Scheduled":
        return "📅";
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
              📍 {item.address}
            </Text>
            <Text style={styles.expandHint}>Tap to view details</Text>
          </View>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <View style={styles.expandedInfo}>
            <View style={styles.divider} />

            {/* Booking Details */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Booking Details</Text>
              {item.bookingId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Booking ID:</Text>
                  <Text style={[styles.detailValue, styles.bookingIdText]}>{item.bookingId}</Text>
                </View>
              )}
              {/* ...existing code... */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>
                  {item.category?.name || item.categoryName || "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Brand:</Text>
                <Text style={styles.detailValue}>{item.brand}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Model:</Text>
                <Text style={styles.detailValue}>{item.model}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Invoice Number:</Text>
                <Text style={styles.detailValue}>{item.invoiceNumber || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Preferred Date:</Text>
                <Text style={styles.detailValue}>
                  {item.preferredDateTime ? formatDate(item.preferredDateTime) : "Not specified"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{item.address}</Text>
              </View>
              {item.alternateAddress && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Alternate Address:</Text>
                  <Text style={styles.detailValue}>{item.alternateAddress}</Text>
                </View>
              )}
              {item.landmark && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Landmark:</Text>
                  <Text style={styles.detailValue}>{item.landmark}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact:</Text>
                <Text style={styles.detailValue}>{item.contactNumber}</Text>
              </View>
              {item.alternateContactNumber && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Alternate Contact:</Text>
                  <Text style={styles.detailValue}>{item.alternateContactNumber}</Text>
                </View>
              )}
            </View>

            {/* Email Replies Section */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Email Communication</Text>
              {emailsLoading[item._id] ? (
                <ActivityIndicator size="small" color="#2196F3" />
              ) : bookingEmails[item._id]?.length > 0 ? (
                bookingEmails[item._id].map((email, idx) => (
                  <View key={email._id || idx} style={styles.emailItem}>
                    <Text style={styles.emailMeta}>
                      <Text style={{ fontWeight: 'bold' }}>{email.emailType === 'reply' ? 'Reply' : email.emailType === 'outgoing' ? 'Sent' : 'Received'}:</Text>
                      {' '}From: {email.from} | {new Date(email.timestamp).toLocaleString()}
                    </Text>
                    <Text style={styles.emailSubject}>{email.subject}</Text>
                    <Text style={styles.emailBody}>{email.replyText}</Text>
                    <View style={styles.emailDivider} />
                  </View>
                ))
              ) : (
                <Text style={styles.emailEmpty}>No email replies yet.</Text>
              )}
            </View>

            {/* Assigned Staff */}
            {item.assignedTo && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Assigned Staff</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{item.assignedTo.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{item.assignedTo.phone}</Text>
                </View>
              </View>
            )}

            {/* Updates Timeline */}
            {item.updates && item.updates.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Updates</Text>
                {item.updates.map((update, index) => (
                  <View key={index} style={styles.updateItem}>
                    <Text style={styles.updateMessage}>{update.message}</Text>
                    <Text style={styles.updateTime}>
                      {formatDate(update.timestamp)}
                    </Text>
                  </View>
                ))}
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
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No Bookings Yet</Text>
        <Text style={styles.emptyText}>
          You haven't made any bookings yet.
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate("CreateBooking")}
        >
          <Text style={styles.createButtonText}>Create Booking</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emailItem: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  emailMeta: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  emailSubject: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
    color: '#222',
  },
  emailBody: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  emailDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 4,
  },
  emailEmpty: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
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
  },
  headerLeft: {
    flex: 1,
  },
  brandText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
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
    marginTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  expandHint: {
    fontSize: 12,
    color: "#2196F3",
    fontStyle: "italic",
  },
  expandedInfo: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginBottom: 16,
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
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  bookingIdText: {
    fontWeight: "bold",
    color: "#2196F3",
    fontSize: 15,
  },
  updateItem: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  updateMessage: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  updateTime: {
    fontSize: 12,
    color: "#666",
  },
});

export default BookingListScreen;
