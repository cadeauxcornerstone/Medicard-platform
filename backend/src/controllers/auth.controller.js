import { staffLogin, facilityLogin, patientLogin, getUserByToken } from "../services/auth.service.js";

/**
 * Staff login
 */
export async function loginStaff(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await staffLogin(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
}

/**
 * Facility login
 */
export async function loginFacility(req, res) {
  try {
    const { email, password, facilityName, location } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await facilityLogin(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || "Facility login failed",
    });
  }
}

/**
 * Patient login (for vault)
 */
export async function loginPatient(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await patientLogin(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || "Patient login failed",
    });
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(req, res) {
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
        message: "Invalid token",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get current user",
    });
  }
}

/**
 * Logout (client-side mainly, but we can track session if needed)
 */
export async function logout(req, res) {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
}
