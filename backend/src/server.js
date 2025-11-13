import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { initializeFirebase } from "./config/firebaseAdmin.js";

const PORT = process.env.PORT || 4000;

// Initialize Firebase Admin SDK
initializeFirebase();

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO with CORS and transport options
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
  transports: ["polling", "websocket"], // Try polling first, then upgrade to websocket
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  allowEIO3: true, // Allow Engine.IO v3 clients
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  // Handle user joining their own room (for targeted notifications)
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their room`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible in controllers
app.set("io", io);

// Start server - listen on all network interfaces
server.listen(PORT, '0.0.0.0', () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 KAPOOR & SONS DEMO BOOKING SYSTEM");
  console.log("=".repeat(60));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 AdminJS Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🔗 API Endpoint: http://localhost:${PORT}/api/v1/bookings`);
  console.log(`📱 Mobile API: http://192.168.29.132:${PORT}/api/v1`);
  console.log(`⚡ Socket.IO enabled for real-time updates`);
  console.log("\n" + "-".repeat(60));
  console.log("📧 EMAIL AUTOMATION LIVE");
  console.log("-".repeat(60));
  console.log(`→ N8N Webhook: ${process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/send-email"}`);
  console.log(`→ Email Hook: http://localhost:${PORT}/api/email-hook`);
  console.log(`→ Email Logs: http://localhost:${PORT}/api/email-hook/logs`);
  console.log(`→ Email Stats: http://localhost:${PORT}/api/email-hook/stats`);
  console.log("=".repeat(60) + "\n");
});

