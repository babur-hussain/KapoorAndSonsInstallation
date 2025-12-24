/**
 * Logger Utility
 * Provides consistent logging across the application
 */

/**
 * Log a formatted message with a header
 * @param {string} title - The title of the log section
 * @param {Object} data - Key-value pairs to log
 * @param {string} type - Type of log (info, success, error, warning)
 */
export function logFormatted(title, data = {}, type = "info") {
  const icons = {
    info: "ℹ️",
    success: "✅",
    error: "❌",
    warning: "⚠️",
    email: "📧",
    webhook: "🔗",
    database: "💾",
    socket: "⚡",
  };

  const icon = icons[type] || "📝";

  console.log("\n" + "=".repeat(60));
  console.log(`${icon} ${title.toUpperCase()}`);
  console.log("=".repeat(60));

  Object.entries(data).forEach(([key, value]) => {
    const formattedKey = key.padEnd(20);
    const formattedValue = typeof value === "object" ? JSON.stringify(value, null, 2) : value;
    console.log(`${formattedKey}: ${formattedValue}`);
  });

  console.log("=".repeat(60) + "\n");
}

/**
 * Log an error with stack trace
 * @param {string} title - Error title
 * @param {Error} error - Error object
 */
export function logError(title, error) {
  console.error("\n" + "=".repeat(60));
  console.error(`❌ ${title.toUpperCase()}`);
  console.error("=".repeat(60));
  console.error("Error Message:", error.message);
  if (error.stack) {
    console.error("Stack Trace:", error.stack);
  }
  console.error("=".repeat(60) + "\n");
}

/**
 * Log a success message
 * @param {string} message - Success message
 */
export function logSuccess(message) {
  console.log(`✅ ${message}`);
}

/**
 * Log a warning message
 * @param {string} message - Warning message
 */
export function logWarning(message) {
  console.log(`⚠️  ${message}`);
}

/**
 * Log an info message
 * @param {string} message - Info message
 */
export function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

/**
 * Log email-related activity
 * @param {string} action - Action being performed
 * @param {Object} details - Email details
 */
export function logEmail(action, details) {
  logFormatted(`Email ${action}`, details, "email");
}

/**
 * Log webhook activity
 * @param {string} action - Action being performed
 * @param {Object} details - Webhook details
 */
export function logWebhook(action, details) {
  logFormatted(`Webhook ${action}`, details, "webhook");
}

/**
 * Log database activity
 * @param {string} action - Action being performed
 * @param {Object} details - Database details
 */
export function logDatabase(action, details) {
  logFormatted(`Database ${action}`, details, "database");
}

/**
 * Log Socket.IO activity
 * @param {string} action - Action being performed
 * @param {Object} details - Socket details
 */
export function logSocket(action, details) {
  logFormatted(`Socket.IO ${action}`, details, "socket");
}

export default {
  logFormatted,
  logError,
  logSuccess,
  logWarning,
  logInfo,
  logEmail,
  logWebhook,
  logDatabase,
  logSocket,
};

