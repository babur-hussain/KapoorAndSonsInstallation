import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { initializeFirebase } from "./config/firebaseAdmin.js";
import https from "https";

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
  // Fetch and log public IP to help diagnose IP-based network blocks
  (async function logPublicIp() {
    try {
      const ip = await new Promise((resolve, reject) => {
        const req = https.get('https://api.ipify.org?format=json', (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed.ip);
            } catch (e) {
              reject(e);
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => req.destroy(new Error('Timeout fetching public IP')));
      });
      console.log(`🌍 Server public IP: ${ip}`);
      console.log('🔎 If Firebase verifies fail due to IP blocks, ensure this IP has outbound HTTPS access to Google APIs');
    } catch (e) {
      console.warn('⚠️ Could not determine public IP:', e.message);
    }
  })();
});

