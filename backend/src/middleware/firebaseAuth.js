import { verifyIdToken, isFirebaseEnabled } from "../config/firebaseAdmin.js";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

/**
 * Firebase authentication middleware
 * Verifies Firebase ID token and syncs user to MongoDB
 * 
 * Usage:
 * import { firebaseAuth } from "../middleware/firebaseAuth.js";
 * router.get("/protected-route", firebaseAuth, (req, res) => {
 *   // req.user is available here (MongoDB user document)
 *   // req.firebaseDecoded is available here (decoded Firebase token)
 * });
 */
export const firebaseAuth = async (req, res, next) => {
  try {
    // 1. Check if Firebase is enabled
    if (!isFirebaseEnabled()) {
      return res.status(503).json({
        success: false,
        message: "Firebase authentication is not configured on this server.",
      });
    }

    // 2. Check if Authorization header exists and starts with "Bearer"
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer")
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    // 3. Extract token from "Bearer <token>"
    const idToken = req.headers.authorization.split(" ")[1];

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Invalid token format.",
      });
    }

    // 4. Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch (error) {
      console.error("❌ Firebase token verification failed:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized. Invalid or expired Firebase token.",
      });
    }

    // 5. Extract user info from decoded token (including custom claims)
    const { uid, email, phone_number, name } = decodedToken;

    // Get role from Firebase custom claims, default to "customer"
    const firebaseRole = decodedToken.role || "customer";

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Firebase user must have an email address.",
      });
    }

    // 6. Find or create user in MongoDB
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // User doesn't exist, create new user
      console.log(`📝 Creating new user from Firebase: ${email} with role: ${firebaseRole}`);

      user = await User.create({
        firebaseUid: uid,
        email: email.toLowerCase(),
        name: name || email.split("@")[0], // Use name from Firebase or email prefix
        phone: phone_number || "",
        role: firebaseRole, // Use role from Firebase custom claims
        isActive: true,
        // Password is not required for Firebase users
      });

      console.log(`✅ New user created: ${user.email} (${user.role})`);
    } else {
      // User exists, optionally update info if changed
      let updated = false;

      if (user.email !== email.toLowerCase()) {
        user.email = email.toLowerCase();
        updated = true;
      }

      if (phone_number && user.phone !== phone_number) {
        user.phone = phone_number;
        updated = true;
      }

      if (name && user.name !== name) {
        user.name = name;
        updated = true;
      }

      // Sync role from Firebase custom claims
      if (user.role !== firebaseRole) {
        console.log(`🔄 Syncing role from Firebase: ${user.email} (${user.role} → ${firebaseRole})`);
        user.role = firebaseRole;
        updated = true;
      }

      if (updated) {
        await user.save();
        console.log(`📝 Updated user info: ${user.email}`);
      }
    }

    // 7. Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User account is inactive.",
      });
    }

    // 8. Attach user and decoded token to request
    req.user = user;
    req.firebaseDecoded = decodedToken;

    // 9. Continue to next middleware/route handler
    next();
  } catch (error) {
    console.error("❌ Firebase auth middleware error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again.",
    });
  }
};

/**
 * Dual authentication middleware - Supports both JWT and Firebase tokens
 * Tries JWT first, then Firebase if JWT fails
 * 
 * Usage:
 * import { dualAuth } from "../middleware/firebaseAuth.js";
 * router.get("/protected-route", dualAuth, (req, res) => {
 *   // req.user is available here
 *   // req.authType will be "jwt" or "firebase"
 * });
 */
export const dualAuth = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    // Try JWT verification
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (user && user.isActive) {
        req.user = user;
        req.authType = "jwt";
        return next();
      }
    } catch (jwtError) {
      // JWT verification failed, try Firebase
      if (isFirebaseEnabled()) {
        try {
          const decodedToken = await verifyIdToken(token);
          const { uid, email, phone_number, name } = decodedToken;

          // Get role from Firebase custom claims
          const firebaseRole = decodedToken.role || "customer";

          if (!email) {
            return res.status(400).json({
              success: false,
              message: "Firebase user must have an email address.",
            });
          }

          // Find or create user
          let user = await User.findOne({ firebaseUid: uid });

          if (!user) {
            user = await User.create({
              firebaseUid: uid,
              email: email.toLowerCase(),
              name: name || email.split("@")[0],
              phone: phone_number || "",
              role: firebaseRole, // Use role from Firebase custom claims
              isActive: true,
            });
            console.log(`✅ New Firebase user created: ${user.email} (${firebaseRole})`);
          } else {
            // Sync role from Firebase custom claims if different
            if (user.role !== firebaseRole) {
              console.log(`🔄 Syncing role from Firebase: ${user.email} (${user.role} → ${firebaseRole})`);
              user.role = firebaseRole;
              await user.save();
            }
          }

          if (!user.isActive) {
            return res.status(401).json({
              success: false,
              message: "Not authorized. User account is inactive.",
            });
          }

          req.user = user;
          req.firebaseDecoded = decodedToken;
          req.authType = "firebase";
          return next();
        } catch (firebaseError) {
          console.error("❌ Firebase auth failed:", firebaseError.message);
        }
      }
    }

    // Both authentication methods failed
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid or expired token.",
    });
  } catch (error) {
    console.error("❌ Dual auth middleware error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again.",
    });
  }
};

/**
 * Optional Firebase authentication - Attach user if Firebase token is valid, but don't require it
 */
export const optionalFirebaseAuth = async (req, res, next) => {
  try {
    if (
      !isFirebaseEnabled() ||
      !req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer")
    ) {
      return next();
    }

    const idToken = req.headers.authorization.split(" ")[1];
    if (!idToken) {
      return next();
    }

    const decodedToken = await verifyIdToken(idToken);
    const { uid } = decodedToken;

    const user = await User.findOne({ firebaseUid: uid });
    if (user && user.isActive) {
      req.user = user;
      req.firebaseDecoded = decodedToken;
    }
  } catch (error) {
    // Silently fail - user remains undefined
    console.log("ℹ️  Optional Firebase auth failed:", error.message);
  }

  next();
};

