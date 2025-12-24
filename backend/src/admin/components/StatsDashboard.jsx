import React, { useEffect, useState } from "react";
import { Box, H2, H3, Text, Loader } from "@adminjs/design-system";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const StatsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch from new stats endpoint
    fetch("http://localhost:4000/api/v1/stats/overview")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      })
      .then((response) => {
        setStats(response.data);
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
        <Text mt="md" fontSize="sm" color="grey60">
          Make sure you're logged in as an admin and the server is running.
        </Text>
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

  // Prepare data for charts
  const statusData = [
    { name: "Pending", value: stats.pending, color: "#FFA500" },
    { name: "Scheduled", value: stats.scheduled, color: "#2196F3" },
    { name: "Completed", value: stats.completed, color: "#4CAF50" },
    { name: "Cancelled", value: stats.cancelled, color: "#F44336" },
  ];

  return (
    <Box padding="xxl">
      <H2 mb="xl">📊 Kapoor & Sons — Analytics Dashboard</H2>

      {/* Summary Cards */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
        gap="lg"
        mb="xxl"
      >
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon="📝"
          color="#4CAF50"
          subtitle={`${stats.avgBookingsPerDay} per day avg`}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon="⏳"
          color="#FFA500"
          subtitle={`${((stats.pending / stats.totalBookings) * 100).toFixed(1)}% of total`}
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduled}
          icon="📅"
          color="#2196F3"
          subtitle={`${((stats.scheduled / stats.totalBookings) * 100).toFixed(1)}% of total`}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon="✅"
          color="#4CAF50"
          subtitle={`${stats.completionRate}% completion rate`}
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          icon="❌"
          color="#F44336"
          subtitle={`${((stats.cancelled / stats.totalBookings) * 100).toFixed(1)}% of total`}
        />
      </Box>

      {/* Charts Row */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(400px, 1fr))"
        gap="xl"
        mb="xxl"
      >
        {/* Status Distribution Pie Chart */}
        <Box
          padding="lg"
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #ddd",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <H3 mb="lg">Status Distribution</H3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Bookings by Brand Bar Chart */}
        <Box
          padding="lg"
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #ddd",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <H3 mb="lg">Bookings by Brand</H3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.bookingsByBrand}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="brand" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2196F3" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Monthly Trend Line Chart */}
      {stats.monthlyTrend.length > 0 && (
        <Box
          padding="lg"
          mb="xxl"
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #ddd",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <H3 mb="lg">Monthly Booking Trend</H3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#4CAF50"
                strokeWidth={2}
                name="Bookings"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Top Models */}
      {stats.bookingsByModel.length > 0 && (
        <Box
          padding="lg"
          mb="xxl"
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #ddd",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <H3 mb="lg">🏆 Top 5 Models</H3>
          <Box display="flex" flexDirection="column" gap="md">
            {stats.bookingsByModel.map((item, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                padding="md"
                style={{
                  backgroundColor: "#f9f9f9",
                  borderRadius: "4px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <Box>
                  <Text fontWeight="bold">
                    {index + 1}. {item.brand} {item.model}
                  </Text>
                </Box>
                <Box
                  padding="xs"
                  style={{
                    backgroundColor: "#2196F3",
                    color: "#fff",
                    borderRadius: "12px",
                    minWidth: "40px",
                    textAlign: "center",
                  }}
                >
                  <Text fontWeight="bold">{item.count}</Text>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Recent Bookings */}
      {stats.recentBookings.length > 0 && (
        <Box
          padding="lg"
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            border: "1px solid #ddd",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <H3 mb="lg">📋 Recent Bookings</H3>
          <Box display="flex" flexDirection="column" gap="sm">
            {stats.recentBookings.map((booking) => (
              <Box
                key={booking._id}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                padding="md"
                style={{
                  backgroundColor: "#f9f9f9",
                  borderRadius: "4px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <Box>
                  <Text fontWeight="bold">{booking.customerName}</Text>
                  <Text fontSize="sm" color="grey60">
                    {booking.brand} {booking.model}
                  </Text>
                </Box>
                <Box display="flex" alignItems="center" gap="md">
                  <StatusBadge status={booking.status} />
                  <Text fontSize="xs" color="grey60">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Box
    padding="lg"
    style={{
      backgroundColor: "#fff",
      borderRadius: "8px",
      border: `2px solid ${color}`,
      textAlign: "center",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    }}
  >
    <Text fontSize="xxl" mb="sm">
      {icon}
    </Text>
    <Text fontSize="xxxl" fontWeight="bold" color={color}>
      {value}
    </Text>
    <Text fontSize="sm" color="grey80" mb="xs">
      {title}
    </Text>
    {subtitle && (
      <Text fontSize="xs" color="grey60">
        {subtitle}
      </Text>
    )}
  </Box>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
  const colors = {
    Pending: "#FFA500",
    Scheduled: "#2196F3",
    Completed: "#4CAF50",
    Cancelled: "#F44336",
  };

  return (
    <Box
      padding="xs"
      style={{
        backgroundColor: colors[status] || "#999",
        color: "#fff",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "bold",
        minWidth: "80px",
        textAlign: "center",
      }}
    >
      {status}
    </Box>
  );
};

export default StatsDashboard;

