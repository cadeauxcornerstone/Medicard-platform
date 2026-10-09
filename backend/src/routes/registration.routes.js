import express from 'express';
import {
  register,
  verify,
  initiatePayment,
  getPaymentStatus,
  getSubscription,
  getRegistrationDetails,
} from '../controllers/registration.controller.js';

const router = express.Router();

/**
 * @route   POST /api/v1/registration/register
 * @desc    Register a new patient
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/v1/registration/verify
 * @desc    Verify email with code
 * @access  Public
 */
router.post('/verify', verify);

/**
 * @route   POST /api/v1/registration/payment/initiate
 * @desc    Initiate a XentriPay Mobile Money collection
 * @access  Public
 */
router.post('/payment/initiate', initiatePayment);

/**
 * @route   GET /api/v1/registration/payment/:paymentId/status
 * @desc    Check a XentriPay collection and activate the subscription on success
 * @access  Public
 */
router.get('/payment/:paymentId/status', getPaymentStatus);

/**
 * @route   GET /api/v1/registration/subscription/:patientId
 * @desc    Get patient subscription
 * @access  Public (token required in header)
 */
router.get('/subscription/:patientId', getSubscription);

/**
 * @route   GET /api/v1/registration/details/:email
 * @desc    Get registration details by email
 * @access  Public
 */
router.get('/details/:email', getRegistrationDetails);

export default router;
