import app from "./app.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 AdminJS Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🔗 API Endpoint: http://localhost:${PORT}/api/v1/bookings`);
});

