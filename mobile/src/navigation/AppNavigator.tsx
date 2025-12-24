import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth, UserRole } from "../context/AuthContext";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import PhoneLoginScreen from "../screens/auth/PhoneLoginScreen";

// Customer Screens
import CustomerDashboard from "../screens/customer/CustomerDashboard";
import BookingListScreen from "../screens/customer/BookingListScreen";

// Staff Screens
import StaffDashboard from "../screens/staff/StaffDashboard";

// Admin Screens
import AdminDashboard from "../screens/admin/AdminDashboard";
import AdminStatsScreen from "../screens/admin/AdminStatsScreen";
import AllBookingsScreen from "../screens/admin/AllBookingsScreen";

// Shared Screens
import BookingFormScreen from "../screens/BookingFormScreen";
import HomeScreen from "../screens/HomeScreen";

const Stack = createNativeStackNavigator();

/**
 * Auth Stack - For unauthenticated users
 */
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
    </Stack.Navigator>
  );
};

/**
 * Customer Stack - For customer role
 */
const CustomerStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#007AFF",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="CustomerDashboard"
        component={CustomerDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookingForm"
        component={BookingFormScreen}
        options={{ title: "Create Booking" }}
      />
      <Stack.Screen
        name="MyBookings"
        component={BookingListScreen}
        options={{ title: "My Bookings" }}
      />
      <Stack.Screen
        name="Profile"
        component={HomeScreen}
        options={{ title: "My Profile" }}
      />
    </Stack.Navigator>
  );
};

/**
 * Staff Stack - For staff role
 */
const StaffStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#28a745",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="StaffDashboard"
        component={StaffDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AllBookings"
        component={HomeScreen}
        options={{ title: "All Bookings" }}
      />
      <Stack.Screen
        name="MyAssignments"
        component={HomeScreen}
        options={{ title: "My Assignments" }}
      />
      <Stack.Screen
        name="Profile"
        component={HomeScreen}
        options={{ title: "My Profile" }}
      />
    </Stack.Navigator>
  );
};

/**
 * Admin Stack - For admin role
 */
const AdminStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#dc3545",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AllBookings"
        component={AllBookingsScreen}
        options={{ title: "All Bookings" }}
      />
      <Stack.Screen
        name="UserManagement"
        component={HomeScreen}
        options={{ title: "User Management" }}
      />
      <Stack.Screen
        name="Analytics"
        component={AdminStatsScreen}
        options={{ title: "Analytics" }}
      />
      <Stack.Screen
        name="SystemSettings"
        component={HomeScreen}
        options={{ title: "System Settings" }}
      />
      <Stack.Screen
        name="ActivityLogs"
        component={HomeScreen}
        options={{ title: "Activity Logs" }}
      />
      <Stack.Screen
        name="Profile"
        component={HomeScreen}
        options={{ title: "My Profile" }}
      />
    </Stack.Navigator>
  );
};

/**
 * Loading Screen Component
 */
const LoadingScreen = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
};

/**
 * Main App Navigator
 * Routes users to different stacks based on authentication and role
 */
const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If not authenticated, show auth stack
  if (!isAuthenticated || !user) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  // Route based on user role
  const getRoleBasedStack = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <AdminStack />;
      case "staff":
        return <StaffStack />;
      case "customer":
      default:
        return <CustomerStack />;
    }
  };

  return (
    <NavigationContainer>
      {getRoleBasedStack(user.role)}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});

export default AppNavigator;

