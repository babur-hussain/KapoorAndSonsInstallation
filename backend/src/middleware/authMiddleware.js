import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

/**
 * Protect middleware - Verify JWT token and attach user to request
 * 
 * Usage:
 * import { protect } from "../middleware/authMiddleware.js";
 * router.get("/protected-route", protect, (req, res) => {
 *   // req.user is available here
 * });
 */
export const protect = async (req, res, next) => {
  let token;

  try {
    // 1. Check if Authorization header exists and starts with "Bearer"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Fetch user from database (excluding password)
    const user = await User.findById(decoded.id).select("-password");

    // 5. Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User not found.",
      });
    }

    // 6. Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User account is inactive.",
      });
    }

    // 7. Attach user to request object
    req.user = user;

    // 8. Continue to next middleware/route handler
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);

    // Handle specific JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Invalid token.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token expired.",
      });
    }

    // Generic error
    return res.status(401).json({
      success: false,
      message: "Not authorized. Authentication failed.",
    });
  }
};

/**
 * Optional protect middleware - Attach user if token is valid, but don't require it
 * Useful for routes that work differently for authenticated vs unauthenticated users
 */
export const optionalProtect = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail - user remains undefined
    console.log("ℹ️  Optional auth failed:", error.message);
  }

  next();
};

/**
 * Role-based authorization middleware
 * Checks if authenticated user has one of the allowed roles
 * Must be used after protect middleware
 *
 * Usage:
 * router.get("/admin-route", protect, authorize("admin"), handler);
 * router.get("/staff-route", protect, authorize("admin", "staff"), handler);
 *
 * @param {...string} roles - Allowed roles (e.g., "admin", "staff", "customer")
 * @returns {Function} Express middleware function
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login first.",
      });
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${req.user.role}`,
      });
    }

    // User has required role, continue
    next();
  };
};

/**
 * Admin-only middleware - Requires user to be authenticated and have admin role
 * Must be used after protect middleware
 * @deprecated Use authorize("admin") instead
 */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Please login first.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden. Admin access required.",
    });
  }

  next();
};

/**
 * Generate JWT token
 * @param {string} userId - User ID to encode in token
 * @param {string} expiresIn - Token expiration time (default: 30d)
 * @returns {string} JWT token
 */
export const generateToken = (userId, expiresIn = "30d") => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

