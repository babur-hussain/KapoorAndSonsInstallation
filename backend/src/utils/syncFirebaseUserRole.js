import { User } from "../models/User.js";

/**
 * Update user role in MongoDB
 * This should only be called by admin users
 * 
 * @param {string} userId - MongoDB user ID or Firebase UID
 * @param {string} newRole - New role to assign ("customer", "staff", "admin")
 * @param {Object} adminUser - Admin user making the change (for logging)
 * @returns {Promise<Object>} Updated user object
 */
export const updateUserRole = async (userId, newRole, adminUser = null) => {
  try {
    // Validate role
    const validRoles = ["customer", "staff", "admin"];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}. Must be one of: ${validRoles.join(", ")}`);
    }

    // Find user by MongoDB ID or Firebase UID
    let user = await User.findById(userId);
    if (!user) {
      user = await User.findOne({ firebaseUid: userId });
    }

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Store old role for logging
    const oldRole = user.role;

    // Update role
    user.role = newRole;
    await user.save();

    // Log the change
    const adminInfo = adminUser ? `by ${adminUser.email} (${adminUser.role})` : "programmatically";
    console.log(`🔄 User role updated ${adminInfo}: ${user.email} (${oldRole} → ${newRole})`);

    return {
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        oldRole,
      },
    };
  } catch (error) {
    console.error("❌ Failed to update user role:", error.message);
    throw error;
  }
};

/**
 * Bulk update user roles
 * 
 * @param {Array<{userId: string, role: string}>} updates - Array of user updates
 * @param {Object} adminUser - Admin user making the changes
 * @returns {Promise<Object>} Results of bulk update
 */
export const bulkUpdateUserRoles = async (updates, adminUser = null) => {
  const results = {
    success: [],
    failed: [],
  };

  for (const update of updates) {
    try {
      const result = await updateUserRole(update.userId, update.role, adminUser);
      results.success.push(result);
    } catch (error) {
      results.failed.push({
        userId: update.userId,
        role: update.role,
        error: error.message,
      });
    }
  }

  console.log(`✅ Bulk role update complete: ${results.success.length} succeeded, ${results.failed.length} failed`);

  return results;
};

/**
 * Get all users with a specific role
 * 
 * @param {string} role - Role to filter by
 * @returns {Promise<Array>} Array of users with the specified role
 */
export const getUsersByRole = async (role) => {
  try {
    const validRoles = ["customer", "staff", "admin"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}`);
    }

    const users = await User.find({ role }).select("-password");
    return users;
  } catch (error) {
    console.error("❌ Failed to get users by role:", error.message);
    throw error;
  }
};

/**
 * Promote user to admin
 * Convenience function for making a user an admin
 * 
 * @param {string} userEmail - Email of user to promote
 * @param {Object} adminUser - Admin user making the change
 * @returns {Promise<Object>} Updated user object
 */
export const promoteToAdmin = async (userEmail, adminUser = null) => {
  try {
    const user = await User.findOne({ email: userEmail.toLowerCase() });
    
    if (!user) {
      throw new Error(`User not found with email: ${userEmail}`);
    }

    if (user.role === "admin") {
      console.log(`ℹ️  User ${userEmail} is already an admin`);
      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          message: "User is already an admin",
        },
      };
    }

    return await updateUserRole(user._id.toString(), "admin", adminUser);
  } catch (error) {
    console.error("❌ Failed to promote user to admin:", error.message);
    throw error;
  }
};

/**
 * Demote admin to customer
 * 
 * @param {string} userEmail - Email of user to demote
 * @param {Object} adminUser - Admin user making the change
 * @returns {Promise<Object>} Updated user object
 */
export const demoteFromAdmin = async (userEmail, adminUser = null) => {
  try {
    const user = await User.findOne({ email: userEmail.toLowerCase() });
    
    if (!user) {
      throw new Error(`User not found with email: ${userEmail}`);
    }

    if (user.role !== "admin") {
      console.log(`ℹ️  User ${userEmail} is not an admin (current role: ${user.role})`);
      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          message: "User is not an admin",
        },
      };
    }

    return await updateUserRole(user._id.toString(), "customer", adminUser);
  } catch (error) {
    console.error("❌ Failed to demote user from admin:", error.message);
    throw error;
  }
};

/**
 * Check if user has admin role
 * 
 * @param {string} userId - MongoDB user ID or Firebase UID
 * @returns {Promise<boolean>} True if user is admin
 */
export const isAdmin = async (userId) => {
  try {
    let user = await User.findById(userId);
    if (!user) {
      user = await User.findOne({ firebaseUid: userId });
    }

    return user && user.role === "admin";
  } catch (error) {
    console.error("❌ Failed to check admin status:", error.message);
    return false;
  }
};

export default {
  updateUserRole,
  bulkUpdateUserRoles,
  getUsersByRole,
  promoteToAdmin,
  demoteFromAdmin,
  isAdmin,
};

