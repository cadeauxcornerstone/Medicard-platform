import express from "express";
import {
  loginStaff,
  loginFacility,
  loginPatient,
  getCurrentUser,
  logout,
} from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * @route   POST /api/v1/auth/staff/login
 * @desc    Staff login
 * @access  Public
 */
router.post("/staff/login", loginStaff);

/**
 * @route   POST /api/v1/auth/facility/login
 * @desc    Facility login
 * @access  Public
 */
router.post("/facility/login", loginFacility);

/**
 * @route   POST /api/v1/auth/patient/login
 * @desc    Patient login (for vault)
 * @access  Public
 */
router.post("/patient/login", loginPatient);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get("/me", getCurrentUser);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout
 * @access  Private
 */
router.post("/logout", logout);

export default router;
