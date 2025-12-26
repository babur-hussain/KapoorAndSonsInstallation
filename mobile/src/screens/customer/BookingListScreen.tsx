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
  TextInput,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from '../../config/api';
import { getBookingEmails, triggerBookingReschedule } from '../../services/api';
import socketService from "../../services/socketService";
import axios from "axios";
import SuccessAnimation from "../../components/SuccessAnimation";

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
  serviceType?: string;
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
  lastRescheduleEmailAt?: string;
  rescheduleCount?: number;
}

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const RESCHEDULE_INTERVAL_MS = 24 * ONE_HOUR_MS;

const formatDuration = (ms: number) => {
  const safeMs = Math.max(ms, 0);
  const hours = Math.floor(safeMs / ONE_HOUR_MS);
  const minutes = Math.ceil((safeMs % ONE_HOUR_MS) / ONE_MINUTE_MS);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${Math.max(minutes, 1)}m`;
};

const buildEmailKey = (email: any) => {
  const timestampValue = email?.timestamp ? new Date(email.timestamp).getTime() : 0;
  const safeTimestamp = Number.isNaN(timestampValue) ? 0 : timestampValue;
  const normalizedReply = (email?.replyText || "").trim();
  const normalizedSubject = (email?.subject || "").trim();
  return (
    email?.messageId ||
    email?._id ||
    `${normalizedSubject}-${safeTimestamp}-${normalizedReply}`
  );
};

const deduplicateEmails = (emails: any[] = []) => {
  const seenKeys = new Set<string>();
  return emails.filter((email) => {
    const key = buildEmailKey(email);
    if (seenKeys.has(key)) {
      return false;
    }
    seenKeys.add(key);
    return true;
  });
};

const BookingListScreen = ({ navigation }: any) => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookingEmails, setBookingEmails] = useState<{ [key: string]: any[] }>({});
  const [emailsLoading, setEmailsLoading] = useState<{ [key: string]: boolean }>({});
  const [bookingStatuses, setBookingStatuses] = useState<{ [key: string]: string }>({});
  const [rescheduleLoading, setRescheduleLoading] = useState<{ [key: string]: boolean }>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Reminder sent.");
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 25;
  const fetchBookingEmails = async (bookingId: string, currentStatus?: string) => {
    if (!token) return;
    setEmailsLoading(prev => ({ ...prev, [bookingId]: true }));
    try {
      const emails = await getBookingEmails(bookingId, token);
      const uniqueEmails = deduplicateEmails(emails);
      setBookingEmails(prev => ({ ...prev, [bookingId]: uniqueEmails }));
      
      // Update status based on email replies
      const hasEmailReply = uniqueEmails.some(email => email.emailType === 'reply');
      const bookingStatus = currentStatus || bookings.find(b => b._id === bookingId)?.status;
      if (hasEmailReply && bookingStatus === 'Pending') {
        setBookingStatuses(prev => ({ ...prev, [bookingId]: 'Completed' }));
      }
    } catch (err) {
      setBookingEmails(prev => ({ ...prev, [bookingId]: [] }));
    } finally {
      setEmailsLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const fetchBookings = async (page: number = 1, options?: { append?: boolean }) => {
    const append = options?.append ?? page > 1;
    if (append) {
      setLoadMoreLoading(true);
    }
    try {
      const skip = (page - 1) * itemsPerPage;
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('skip', skip.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await axios.get(`${API_BASE_URL}/bookings/user?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const newData: Booking[] = response.data.data || [];
        if (append) {
          setAllBookings(prev => [...prev, ...newData]);
          setBookings(prev => [...prev, ...newData]);
        } else {
          setAllBookings(newData);
          setBookings(newData);
        }
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(page);
        
        // Check email status for all pending bookings to update their status
        newData.forEach((booking: Booking) => {
          if (booking.status === 'Pending') {
            fetchBookingEmails(booking._id, 'Pending');
          }
        });
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
      setLoadMoreLoading(false);
    }
  };

  // Initial load and Socket.IO setup
  useEffect(() => {
    fetchBookings(1);

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

    const handleEmailReplyReceived = (data: any) => {
      console.log("⚡ Email reply received:", data);
      // Refresh emails for the matched booking
      if (data.bookingId) {
        fetchBookingEmails(data.bookingId);
      }
      // Also show a notification if the booking is in the list
      const matchedBooking = bookings.find(b => b._id === data.bookingId);
      if (matchedBooking) {
        Alert.alert(
          "New Response Received",
          `${matchedBooking.brand} ${matchedBooking.model} - ${data.from}`,
          [{ text: "OK" }]
        );
      }
    };

    // Add listeners
    socketService.on("bookingCreated", handleBookingCreated);
    socketService.on("bookingUpdated", handleBookingUpdated);
    socketService.on("bookingStatusChanged", handleBookingStatusChanged);
    socketService.on("emailReplyReceived", handleEmailReplyReceived);

    // Cleanup listeners on unmount
    return () => {
      socketService.off("bookingCreated", handleBookingCreated);
      socketService.off("bookingUpdated", handleBookingUpdated);
      socketService.off("bookingStatusChanged", handleBookingStatusChanged);
      socketService.off("emailReplyReceived", handleEmailReplyReceived);
    };
  }, []);

  // Local search filtering - instant, no API call
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setBookings(allBookings);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allBookings.filter((booking) =>
        booking.customerName.toLowerCase().includes(query) ||
        booking.brand.toLowerCase().includes(query) ||
        booking.model.toLowerCase().includes(query) ||
        booking.contactNumber.includes(query) ||
        booking.bookingId?.toLowerCase().includes(query) ||
        booking.address.toLowerCase().includes(query) ||
        booking.categoryName?.toLowerCase().includes(query) ||
        booking.invoiceNumber?.toLowerCase().includes(query)
      );
      setBookings(filtered);
    }
  }, [searchQuery, allBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings(1, { append: false });
  }, []);

  const handleLoadMore = () => {
    if (currentPage >= totalPages || loadMoreLoading) return;
    fetchBookings(currentPage + 1, { append: true });
  };

  const toggleExpand = (id: string) => {
    const wasExpanded = expandedId === id;
    setExpandedId(wasExpanded ? null : id);
    // Only fetch emails if expanding (not collapsing) and haven't fetched before
    if (!wasExpanded && !bookingEmails[id]) {
      fetchBookingEmails(id);
    }
  };

  const getEffectiveStatus = (booking: Booking) =>
    bookingStatuses[booking._id] || booking.status;

  const hasEmailReply = (booking: Booking) => {
    const replies = bookingEmails[booking._id];
    if (!replies || replies.length === 0) return false;
    return replies.some((email) => email.emailType === "reply");
  };

  const isInCooldown = (booking: Booking) => {
    if (!booking.lastRescheduleEmailAt) return false;
    const lastTrigger = new Date(booking.lastRescheduleEmailAt).getTime();
    return Date.now() - lastTrigger < RESCHEDULE_INTERVAL_MS;
  };

  const shouldShowRescheduleButton = (booking: Booking) => {
    if (getEffectiveStatus(booking) !== "Pending") return false;
    if (hasEmailReply(booking)) return false;
    if (isInCooldown(booking)) return false;
    return true;
  };

  const getRescheduleCooldownMessage = (booking: Booking) => {
    if (getEffectiveStatus(booking) !== "Pending") return null;
    if (hasEmailReply(booking)) {
      return "Email reply received; no further reminders needed.";
    }
    if (isInCooldown(booking)) {
      const lastTrigger = new Date(booking.lastRescheduleEmailAt || 0).getTime();
      const remaining = RESCHEDULE_INTERVAL_MS - (Date.now() - lastTrigger);
      return `You can resend in ${formatDuration(remaining)}.`;
    }
    return null;
  };

  const handleReschedulePress = async (booking: Booking) => {
    if (!token) {
      Alert.alert(
        "Authentication Required",
        "Please login again to request a reschedule."
      );
      return;
    }

    setRescheduleLoading((prev) => ({ ...prev, [booking._id]: true }));

    try {
      const response = await triggerBookingReschedule(
        { mongoId: booking._id, bookingCode: booking.bookingId },
        token
      );
      if (!response?.success) {
        throw new Error(response?.message || "Unable to trigger reschedule.");
      }
      const lastTrigger =
        response?.data?.lastRescheduleEmailAt || new Date().toISOString();
      const countFromServer = response?.data?.rescheduleCount;

      setBookings((prev) =>
        prev.map((existingBooking) =>
          existingBooking._id === booking._id
            ? {
                ...existingBooking,
                lastRescheduleEmailAt: lastTrigger,
                rescheduleCount:
                  typeof countFromServer === "number"
                    ? countFromServer
                    : (existingBooking.rescheduleCount || 0) + 1,
              }
            : existingBooking
        )
      );

      setSuccessMessage(response?.message || "Reminder sent.");
      setShowSuccess(true);
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      Alert.alert(
        "Reschedule Failed",
        serverMessage || error.message || "Unable to trigger reschedule."
      );
    } finally {
      setRescheduleLoading((prev) => ({ ...prev, [booking._id]: false }));
    }
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
    const displayStatus = bookingStatuses[item._id] || item.status;
    const showReschedule = shouldShowRescheduleButton(item);
    const rescheduleMessage = getRescheduleCooldownMessage(item);

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
              { backgroundColor: getStatusColor(displayStatus) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusIcon(displayStatus)} {displayStatus}
            </Text>
          </View>
        </View>

        {/* Collapsed View */}
        {!isExpanded && (
          <View style={styles.collapsedInfo}>
            <Text style={styles.customerNameCollapsed} numberOfLines={1}>
              👤 {item.customerName}
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
                <Text style={styles.detailLabel}>Service Type:</Text>
                <Text style={[styles.detailValue, styles.serviceTypeHighlight]}>{item.serviceType || "N/A"}</Text>
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
                <Text style={styles.detailLabel}>Customer Name:</Text>
                <Text style={styles.detailValue}>{item.customerName || "N/A"}</Text>
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

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Need A Follow-up?</Text>
              {showReschedule ? (
                <>
                  <Text style={styles.rescheduleHint}>
                    Resend the booking email to the company to nudge for a new
                    schedule.
                  </Text>
                  <TouchableOpacity
                    style={styles.rescheduleButton}
                    onPress={() => handleReschedulePress(item)}
                    disabled={rescheduleLoading[item._id]}
                  >
                    {rescheduleLoading[item._id] ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.rescheduleButtonText}>
                        Reschedule Booking
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                rescheduleMessage && (
                  <View style={styles.rescheduleInfoBox}>
                    <Text style={styles.rescheduleInfoText}>
                      {rescheduleMessage}
                    </Text>
                  </View>
                )
              )}
            </View>

            {/* Email Replies Section */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Email Communication</Text>
              {emailsLoading[item._id] ? (
                <ActivityIndicator size="small" color="#2196F3" />
              ) : bookingEmails[item._id]?.length > 0 ? (
                bookingEmails[item._id].map((email, idx) => (
                  <View key={buildEmailKey(email) || idx} style={styles.emailCard}>
                    {/* Reply Text */}
                    <Text style={styles.emailReplyText}>{email.replyText}</Text>
                    
                    {/* Divider */}
                    <View style={styles.emailMiddleDivider} />
                    
                    {/* Metadata - all in small light gray */}
                    <View style={styles.emailMetadata}>
                      <Text style={styles.emailMetaText}>Subject: {email.subject}</Text>
                      <Text style={styles.emailMetaText}>From: {email.from}</Text>
                      <Text style={styles.emailMetaText}>Type: {email.emailType === 'reply' ? '📬 Reply' : email.emailType === 'outgoing' ? '📤 Sent' : '📥 Received'}</Text>
                      <Text style={styles.emailMetaText}>Time: {formatDate(email.timestamp)}</Text>
                      {email._id && (
                        <Text style={styles.emailMetaText}>ID: {email._id}</Text>
                      )}
                      {email.to && (
                        <Text style={styles.emailMetaText}>To: {email.to}</Text>
                      )}
                      {email.messageId && (
                        <Text style={styles.emailMetaText}>Message ID: {email.messageId}</Text>
                      )}
                    </View>
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

  const noBookings = allBookings.length === 0 && searchQuery.trim() === "";

  if (noBookings) {
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
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, model, mobile, address..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setCurrentPage(1); fetchBookings(1); }} />
        }
        ListEmptyComponent={
          <View style={styles.emptySearchContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptyText}>
              Try another search term.
            </Text>
          </View>
        }
        ListFooterComponent={
          currentPage < totalPages ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
              disabled={loadMoreLoading}
            >
              {loadMoreLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loadMoreText}>Load more bookings</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
      />

      {showSuccess && (
        <SuccessAnimation
          message={successMessage}
          onComplete={() => setShowSuccess(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: "#333",
    paddingVertical: 10,
  },
  clearButton: {
    fontSize: 18,
    color: "#999",
    padding: 8,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 8,
  },
  paginationButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#2196F3",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  paginationButtonDisabled: {
    backgroundColor: "#ccc",
  },
  paginationButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  emailCard: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emailReplyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    lineHeight: 24,
    marginBottom: 12,
  },
  emailMiddleDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginBottom: 10,
  },
  emailMetadata: {
    gap: 4,
  },
  emailMetaText: {
    fontSize: 10,
    color: '#aaa',
    lineHeight: 16,
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
  loadMoreButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#2196F3",
    alignItems: "center",
  },
  loadMoreText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
  customerNameCollapsed: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 6,
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
  serviceTypeHighlight: {
    color: "#ff0000",
    fontWeight: "bold",
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
  rescheduleHint: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  rescheduleButton: {
    backgroundColor: "#ff9500",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  rescheduleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  rescheduleInfoBox: {
    backgroundColor: "#f1f5ff",
    padding: 12,
    borderRadius: 8,
  },
  rescheduleInfoText: {
    fontSize: 13,
    color: "#4a5d8f",
  },
});

export default BookingListScreen;
