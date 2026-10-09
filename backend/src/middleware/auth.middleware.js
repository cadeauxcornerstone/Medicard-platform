import { verifyToken, getUserByToken } from "../services/auth.service.js";

/**
 * Authenticate user from JWT token
 */
export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const user = await getUserByToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || "Authentication failed",
    });
  }
}

/**
 * Check if user has required role
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (req.user.type === "patient") {
      return res.status(403).json({
        success: false,
        message: "Patients cannot access staff routes",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
}

/**
 * Check if user is a patient
 */
export function requirePatient(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  if (req.user.type !== "patient") {
    return res.status(403).json({
      success: false,
      message: "This route is for patients only",
    });
  }

  next();
}
