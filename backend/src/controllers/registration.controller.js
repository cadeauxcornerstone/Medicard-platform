import {
  registerPatient,
  verifyEmail,
  initiateVaultPayment,
  getVaultPaymentStatus,
  getPatientSubscription,
  getRegistrationDetails as lookupRegistrationDetails,
} from '../services/registration.service.js';

/**
 * Register a new patient
 */
export async function register(req, res) {
  try {
    const { email, phone, password, firstName, lastName, plan } = req.body;

    // Validate required fields
    if (
      typeof email !== 'string' ||
      typeof phone !== 'string' ||
      typeof password !== 'string' ||
      typeof firstName !== 'string' ||
      typeof lastName !== 'string' ||
      typeof plan !== 'string' ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !firstName.trim() ||
      !lastName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required. Please fill in all information.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    // Validate phone number
    if (phone.trim().replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid phone number',
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Validate plan
    if (!['BASIC', 'PREMIUM'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Must be BASIC or PREMIUM',
      });
    }

    const result = await registerPatient({
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      plan,
    });

    res.status(result.alreadyVerified ? 200 : 201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error.message.includes('Email already registered')) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Enter the password for that account to continue, or use a different email.',
      });
    }

    if (error.message.includes('Failed to send verification email')) {
      return res.status(502).json({
        success: false,
        message: 'We could not send the verification email. Please try again.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.',
    });
  }
}

/**
 * Verify email with code
 */
export async function verify(req, res) {
  try {
    const { email, code } = req.body;

    if (typeof email !== 'string' || !email.trim() || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required',
      });
    }

    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code must be 6 digits',
      });
    }

    const result = await verifyEmail(email.trim().toLowerCase(), code);

    res.status(200).json(result);
  } catch (error) {
    console.error('Verification error:', error);
    
    if (error.message.includes('Invalid or expired')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new code.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.',
    });
  }
}

/**
 * Process payment and create subscription
 */
export async function initiatePayment(req, res) {
  try {
    const { patientId, plan, paymentMethod, phone } = req.body;

    if (!patientId || !plan || !paymentMethod || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const payment = await initiateVaultPayment(patientId, plan, paymentMethod, phone);
    res.status(payment.status === 'PENDING' ? 200 : 201).json({
      success: true,
      ...payment,
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    const status = error.message.includes('XENTRIPAY_API_KEY') ? 503
      : error.message.includes('XentriPay') || error.message.includes('reach XentriPay') ? 502
        : 400;
    res.status(status).json({
      success: false,
      message: error.message || 'Payment processing failed',
    });
  }
}

export async function getPaymentStatus(req, res) {
  try {
    const result = await getVaultPaymentStatus(req.params.paymentId);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Payment status error:', error);
    const status = error.message.includes('XENTRIPAY_API_KEY') ? 503
      : error.message.includes('XentriPay') || error.message.includes('reach XentriPay') ? 502
        : error.message.includes('not found') ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Payment status check failed',
    });
  }
}

/**
 * Get patient subscription
 */
export async function getSubscription(req, res) {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
      });
    }

    const subscription = await getPatientSubscription(patientId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found',
      });
    }

    res.status(200).json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get subscription',
    });
  }
}

/**
 * Get registration details by email
 */
export async function getRegistrationDetails(req, res) {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const details = await lookupRegistrationDetails(email);

    if (!details) {
      return res.status(404).json({
        success: false,
        message: 'No registration found',
      });
    }

    res.status(200).json({
      success: true,
      details,
    });
  } catch (error) {
    console.error('Get registration details error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get registration details',
    });
  }
}
