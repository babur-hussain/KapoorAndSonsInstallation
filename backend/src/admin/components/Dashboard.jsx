import React, { useEffect, useState } from "react";
import { Box, H2, H3, Text, Loader } from "@adminjs/design-system";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/api/v1/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box padding="xxl" textAlign="center">
        <Loader />
        <Text mt="lg">Loading dashboard statistics...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding="xxl">
        <H2>❌ Error Loading Dashboard</H2>
        <Text color="error">{error}</Text>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box padding="xxl">
        <Text>No statistics available</Text>
      </Box>
    );
  }

  return (
    <Box padding="xxl">
      <H2 mb="xl">📊 Kapoor & Sons — Demo Booking Dashboard</H2>

      {/* Overview Cards */}
      <Box
        display="flex"
        flexWrap="wrap"
        gap="lg"
        mb="xxl"
        style={{ marginBottom: "2rem" }}
      >
        <StatCard
          title="Total Bookings"
          value={stats.bookings.total}
          icon="📝"
          color="#4CAF50"
        />
        <StatCard
          title="Pending"
          value={stats.bookings.pending}
          icon="⏳"
          color="#FF9800"
        />
        <StatCard
          title="Confirmed"
          value={stats.bookings.confirmed}
          icon="✅"
          color="#2196F3"
        />
        <StatCard
          title="Completed"
          value={stats.bookings.completed}
          icon="✔️"
          color="#4CAF50"
        />
        <StatCard
          title="In Progress"
          value={stats.bookings.inProgress}
          icon="🔄"
          color="#9C27B0"
        />
        <StatCard
          title="Cancelled"
          value={stats.bookings.cancelled}
          icon="❌"
          color="#F44336"
        />
      </Box>

      {/* Recent Activity */}
      <Box mb="xxl">
        <H3 mb="lg">📈 Recent Activity (Last 7 Days)</H3>
        <Box
          padding="lg"
          style={{
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        >
          <Text fontSize="xl" fontWeight="bold">
            {stats.bookings.recent} new bookings
          </Text>
        </Box>
      </Box>

      {/* Status Distribution */}
      <Box mb="xxl">
        <H3 mb="lg">📊 Status Distribution</H3>
        <Box
          display="flex"
          flexDirection="column"
          gap="sm"
          style={{ maxWidth: "600px" }}
        >
          {stats.statusDistribution.map((item) => (
            <StatusBar
              key={item.status}
              status={item.status}
              count={item.count}
              total={stats.bookings.total}
            />
          ))}
        </Box>
      </Box>

      {/* Brand Summary */}
      <Box mb="xxl">
        <H3 mb="lg">🏢 Brand-wise Breakdown</H3>
        {stats.brandSummary.length > 0 ? (
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(250px, 1fr))"
            gap="lg"
          >
            {stats.brandSummary.map((brand) => (
              <BrandCard key={brand._id} brand={brand} />
            ))}
          </Box>
        ) : (
          <Text>No bookings yet</Text>
        )}
      </Box>

      {/* Bookings by Date */}
      {stats.bookingsByDate.length > 0 && (
        <Box mb="xxl">
          <H3 mb="lg">📅 Bookings by Date (Last 7 Days)</H3>
          <Box
            display="flex"
            flexDirection="column"
            gap="sm"
            style={{ maxWidth: "600px" }}
          >
            {stats.bookingsByDate.map((item) => (
              <Box
                key={item._id}
                display="flex"
                justifyContent="space-between"
                padding="md"
                style={{
                  backgroundColor: "#f9f9f9",
                  borderRadius: "4px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <Text fontWeight="bold">{item._id}</Text>
                <Text>{item.count} bookings</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Activity Logs Summary */}
      <Box mb="xxl">
        <H3 mb="lg">📋 Activity Logs Summary</H3>
        <Box
          display="flex"
          gap="lg"
          mb="lg"
          style={{ flexWrap: "wrap" }}
        >
          <StatCard
            title="Total Activities"
            value={stats.activities.total}
            icon="📝"
            color="#607D8B"
          />
          <StatCard
            title="Active Brands"
            value={stats.brands.active}
            icon="🏢"
            color="#3F51B5"
          />
        </Box>

        {/* Recent Activities */}
        {stats.activities.recent.length > 0 && (
          <Box>
            <H3 mb="md" fontSize="md">Recent Activities</H3>
            <Box
              display="flex"
              flexDirection="column"
              gap="sm"
              style={{ maxWidth: "800px" }}
            >
              {stats.activities.recent.slice(0, 5).map((activity) => (
                <ActivityItem key={activity._id} activity={activity} />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Performance Metrics */}
      {stats.performance.avgResponseHours > 0 && (
        <Box mb="xxl">
          <H3 mb="lg">⚡ Performance Metrics</H3>
          <Box
            padding="lg"
            style={{
              backgroundColor: "#e3f2fd",
              borderRadius: "8px",
              border: "1px solid #90caf9",
            }}
          >
            <Text fontSize="lg">
              <strong>Average Response Time:</strong>{" "}
              {stats.performance.avgResponseHours} hours
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => (
  <Box
    flex="1"
    minWidth="150px"
    padding="lg"
    style={{
      backgroundColor: "#fff",
      borderRadius: "8px",
      border: `2px solid ${color}`,
      textAlign: "center",
    }}
  >
    <Text fontSize="xxl" mb="sm">
      {icon}
    </Text>
    <Text fontSize="xxl" fontWeight="bold" color={color}>
      {value}
    </Text>
    <Text fontSize="sm" color="grey60">
      {title}
    </Text>
  </Box>
);

// Status Bar Component
const StatusBar = ({ status, count, total }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const colors = {
    Pending: "#FF9800",
    Confirmed: "#2196F3",
    "In Progress": "#9C27B0",
    Completed: "#4CAF50",
    Cancelled: "#F44336",
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb="xs">
        <Text fontWeight="bold">{status}</Text>
        <Text>
          {count} ({percentage.toFixed(1)}%)
        </Text>
      </Box>
      <Box
        style={{
          width: "100%",
          height: "24px",
          backgroundColor: "#e0e0e0",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <Box
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: colors[status] || "#999",
            transition: "width 0.3s ease",
          }}
        />
      </Box>
    </Box>
  );
};

// Brand Card Component
const BrandCard = ({ brand }) => (
  <Box
    padding="lg"
    style={{
      backgroundColor: "#fff",
      borderRadius: "8px",
      border: "1px solid #ddd",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    }}
  >
    <Text fontSize="lg" fontWeight="bold" mb="sm">
      {brand._id}
    </Text>
    <Text mb="xs">
      <strong>Total:</strong> {brand.count}
    </Text>
    <Text mb="xs" color="warning">
      <strong>Pending:</strong> {brand.pending}
    </Text>
    <Text color="success">
      <strong>Completed:</strong> {brand.completed}
    </Text>
  </Box>
);

// Activity Item Component
const ActivityItem = ({ activity }) => {
  const severityColors = {
    info: "#2196F3",
    success: "#4CAF50",
    warning: "#FF9800",
    error: "#F44336",
  };

  const typeIcons = {
    booking_created: "📝",
    booking_updated: "✏️",
    status_updated: "🔄",
    message_sent: "💬",
    notification_sent: "🔔",
    notification_failed: "❌",
    brand_created: "🏢",
    brand_updated: "🏢",
  };

  return (
    <Box
      padding="md"
      style={{
        backgroundColor: "#f9f9f9",
        borderRadius: "4px",
        border: `1px solid ${severityColors[activity.severity] || "#e0e0e0"}`,
        borderLeft: `4px solid ${severityColors[activity.severity] || "#e0e0e0"}`,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap="sm">
          <Text fontSize="lg">{typeIcons[activity.type] || "📋"}</Text>
          <Text fontSize="sm">{activity.message}</Text>
        </Box>
        <Text fontSize="xs" color="grey60">
          {new Date(activity.createdAt).toLocaleString()}
        </Text>
      </Box>
    </Box>
  );
};

export default Dashboard;

