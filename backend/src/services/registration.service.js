import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail, sendWelcomeEmail } from './email.service.js';

const XENTRIPAY_API_KEY = process.env.XENTRIPAY_API_KEY;
const XENTRIPAY_BASE_URL = (
  process.env.XENTRIPAY_BASE_URL || 'https://merchant.test.xentripay.com'
).replace(/\/+$/, '');
const VAULT_PLAN_PRICES = {
  BASIC: 100,
  PREMIUM: 150,
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

function calculateExpiration() {
  return new Date(Date.now() + 10 * 60 * 1000);
}

/**
 * Register a patient or resume checkout for a previously verified account.
 */
export async function registerPatient(data) {
  const { phone, password, firstName, lastName, plan } = data;
  const email = data.email.trim().toLowerCase();

  const existingPatient = await prisma.patient.findFirst({
    where: { email },
  });

  if (existingPatient) {
    const passwordMatches =
      existingPatient.passwordHash &&
      await bcrypt.compare(password, existingPatient.passwordHash);

    if (!passwordMatches) {
      throw new Error('Email already registered');
    }

    const activeSubscription = await getPatientSubscription(existingPatient.id);
    return {
      success: true,
      alreadyVerified: true,
      hasActiveSubscription: Boolean(activeSubscription),
      patientId: existingPatient.id,
      message: activeSubscription
        ? 'Email already verified and subscription is active.'
        : 'Email already verified. Continue to payment.',
    };
  }

  const pendingRegistration = await prisma.verificationCode.findUnique({
    where: { email },
  });

  const code = generateVerificationCode();
  const expiresAt = calculateExpiration();
  const passwordHash = await bcrypt.hash(password, 10);

  if (pendingRegistration) {
    await prisma.verificationCode.update({
      where: { id: pendingRegistration.id },
      data: {
        code,
        expiresAt,
        verified: false,
        passwordHash,
        phone,
        firstName,
        lastName,
        plan,
      },
    });
  } else {
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt,
        passwordHash,
        phone,
        firstName,
        lastName,
        plan,
      },
    });
  }

  try {
    await sendVerificationEmail(email, code);
  } catch (error) {
    console.error('Verification email delivery failed:', error);
    throw new Error('Failed to send verification email');
  }

  return {
    success: true,
    message: 'Registration successful. Please check your email for verification code.',
    email,
  };
}

/**
 * Verify email with code and create patient account.
 */
export async function verifyEmail(email, code) {
  email = email.trim().toLowerCase();
  const verificationCode = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      verified: false,
      expiresAt: { gte: new Date() },
    },
  });

  if (!verificationCode) {
    throw new Error('Invalid or expired verification code');
  }

  const existingPatient = await prisma.patient.findFirst({
    where: { email },
  });

  if (existingPatient) {
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { verified: true },
    });
    return {
      success: true,
      message: 'Email already verified',
      patientId: existingPatient.id,
    };
  }

  const patient = await prisma.patient.create({
    data: {
      patientNumber: `PAT${Date.now().toString().slice(-8)}`,
      firstName: verificationCode.firstName || 'Patient',
      lastName: verificationCode.lastName || 'User',
      email: verificationCode.email,
      phone: verificationCode.phone,
      passwordHash: verificationCode.passwordHash,
    },
  });

  await prisma.verificationCode.update({
    where: { id: verificationCode.id },
    data: { verified: true },
  });

  return {
    success: true,
    message: 'Email verified successfully',
    patientId: patient.id,
    email: patient.email,
  };
}

function formatRwandaPhone(phone) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('250')) {
    digits = `0${digits.slice(3)}`;
  } else if (digits.length === 9) {
    digits = `0${digits}`;
  }

  if (!/^0\d{9}$/.test(digits)) {
    throw new Error('Enter a valid Rwanda mobile number to receive the payment prompt');
  }

  return {
    local: digits,
    international: `250${digits.slice(1)}`,
  };
}

async function callXentriPay(path, options = {}) {
  if (!XENTRIPAY_API_KEY) {
    throw new Error('XENTRIPAY_API_KEY is not configured');
  }

  const endpoint = new URL(path, `${XENTRIPAY_BASE_URL}/`);
  let response;
  try {
    response = await fetch(endpoint, {
      ...options,
      signal: AbortSignal.timeout(15000),
      headers: {
        'X-XENTRIPAY-KEY': XENTRIPAY_API_KEY,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    console.error('XentriPay request failed:', {
      hostname: endpoint.hostname,
      path: endpoint.pathname,
      cause: error.cause?.code || error.name,
    });
    throw new Error('Unable to reach XentriPay. Please try again.');
  }

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    console.error('XentriPay returned a non-JSON response:', {
      status: response.status,
      contentType: response.headers.get('content-type'),
      body: responseText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240),
    });
    throw new Error(`XentriPay returned an unexpected response (HTTP ${response.status})`);
  }

  if (!response.ok) {
    console.error('XentriPay returned an error:', response.status, result);
    throw new Error(`XentriPay request failed (HTTP ${response.status}): ${result.message || result.error || response.statusText}`);
  }
  return result;
}

/**
 * Start a real XentriPay Mobile Money collection for a verified patient.
 */
export async function initiateVaultPayment(patientId, plan, paymentMethod, paymentPhone) {
  const amount = VAULT_PLAN_PRICES[plan];
  if (!amount) throw new Error('Invalid vault plan');
  if (paymentMethod !== 'MOBILE_MONEY') {
    throw new Error('Invalid payment method');
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });
  if (!patient || !patient.email) {
    throw new Error('Verified patient account not found');
  }
  if (typeof paymentPhone !== 'string' || !paymentPhone.trim()) {
    throw new Error('A phone number is required for Mobile Money payment');
  }
  const phone = formatRwandaPhone(paymentPhone);
  const customerReference = `MC-${crypto.randomUUID()}`;
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Patient" WHERE "id" = ${patientId} FOR UPDATE`;

    const activeSubscription = await tx.patientSubscription.findFirst({
      where: {
        patientId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
    });
    if (activeSubscription && !(activeSubscription.plan === 'BASIC' && plan === 'PREMIUM')) {
      throw new Error(
        activeSubscription.plan === 'PREMIUM'
          ? 'Your Premium vault is already active'
          : 'Only Basic-to-Premium upgrades are available while a plan is active',
      );
    }

    const pendingPayment = await tx.patientVaultPayment.findFirst({
      where: {
        patientId,
        status: { in: ['INITIATING', 'PENDING', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (pendingPayment) {
      if (pendingPayment.plan !== plan) {
        throw new Error('A different vault payment is already in progress');
      }
      return { payment: pendingPayment, reused: true };
    }

    const payment = await tx.patientVaultPayment.create({
      data: {
        patientId,
        plan,
        amount,
        paymentMethod,
        phone: paymentPhone.trim(),
        customerReference,
        status: 'INITIATING',
      },
    });
    return { payment, reused: false };
  });

  if (result.reused) {
    return {
      paymentId: result.payment.id,
      status: result.payment.status,
      phone: result.payment.phone,
      message: 'A payment is already in progress for this account.',
    };
  }

  const attempt = result.payment;

  try {
    const gatewayResult = await callXentriPay('/api/collections/initiate', {
      method: 'POST',
      body: JSON.stringify({
        email: patient.email,
        cname: `${patient.firstName} ${patient.lastName}`,
        amount,
        cnumber: phone.local,
        msisdn: phone.international,
        currency: 'RWF',
        pmethod: 'momo',
        customerRef: customerReference,
        chargesIncluded: true,
        details: `MedCard ${plan} Patient Vault subscription`,
      }),
    });

    if (gatewayResult.success !== 1 || gatewayResult.retcode !== 0 || !gatewayResult.refid) {
      throw new Error(`XentriPay did not accept the payment request: ${gatewayResult.reply || 'unknown response'}`);
    }

    const payment = await prisma.patientVaultPayment.update({
      where: { id: attempt.id },
      data: {
        gatewayReference: String(gatewayResult.refid),
        status: 'PENDING',
      },
    });

    return {
      paymentId: payment.id,
      status: payment.status,
      phone: payment.phone,
      message: 'Payment prompt sent. Approve it on your phone.',
    };
  } catch (error) {
    await prisma.patientVaultPayment.update({
      where: { id: attempt.id },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}

/**
 * Poll XentriPay and activate the subscription only after confirmed success.
 */
export async function getVaultPaymentStatus(paymentId, ownerId) {
  const attempt = await prisma.patientVaultPayment.findUnique({
    where: { id: paymentId },
    include: { patient: true },
  });
  if (!attempt) throw new Error('Payment attempt not found');
  if (ownerId && attempt.patientId !== ownerId) throw new Error('Payment attempt not found');
  if (attempt.status === 'SUCCESS' || attempt.status === 'FAILED') {
    return { status: attempt.status };
  }
  if (attempt.status === 'PROCESSING') return { status: 'PENDING' };
  if (!attempt.gatewayReference) return { status: attempt.status };

  const result = await callXentriPay(
    `/api/collections/status/${encodeURIComponent(attempt.customerReference)}`
  );
  const gatewayStatus = String(result.status || '').toUpperCase();

  if (gatewayStatus === 'SUCCESS') {
    const subscription = await prisma.$transaction(async (tx) => {
      const claim = await tx.patientVaultPayment.updateMany({
        where: {
          id: attempt.id,
          status: { in: ['PENDING', 'INITIATING'] },
        },
        data: { status: 'PROCESSING' },
      });

      if (claim.count === 0) {
        const current = await tx.patientVaultPayment.findUnique({
          where: { id: attempt.id },
        });
        if (current?.status === 'SUCCESS') return null;
        throw new Error('Payment status is being updated. Please check again shortly.');
      }

      const existingSubscription = await tx.patientSubscription.findFirst({
        where: { paymentReference: attempt.customerReference },
      });
      if (existingSubscription) {
        await tx.patientVaultPayment.update({
          where: { id: attempt.id },
          data: { status: 'SUCCESS' },
        });
        return existingSubscription;
      }

      const activeSubscription = await tx.patientSubscription.findFirst({
        where: {
          patientId: attempt.patientId,
          status: 'ACTIVE',
          endDate: { gte: new Date() },
        },
      });
      if (activeSubscription) {
        if (activeSubscription.plan !== 'BASIC' || attempt.plan !== 'PREMIUM') {
          throw new Error('The active vault plan cannot be changed by this payment');
        }
        await tx.patientSubscription.update({
          where: { id: activeSubscription.id },
          data: { status: 'UPGRADED' },
        });
      }

      const created = await tx.patientSubscription.create({
        data: {
          patientId: attempt.patientId,
          plan: attempt.plan,
          amount: attempt.amount,
          currency: 'RWF',
          paymentMethod: attempt.paymentMethod,
          paymentReference: attempt.customerReference,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
        },
      });

      await tx.patientVaultPayment.update({
        where: { id: attempt.id },
        data: { status: 'SUCCESS' },
      });
      return created;
    });

    if (subscription && attempt.patient.email) {
      try {
        await sendWelcomeEmail(attempt.patient.email, attempt.patient.firstName, attempt.plan);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }
    return { status: 'SUCCESS' };
  }

  if (gatewayStatus === 'FAILED') {
    await prisma.patientVaultPayment.updateMany({
      where: { id: attempt.id, status: 'PENDING' },
      data: { status: 'FAILED' },
    });
    return { status: 'FAILED' };
  }

  await prisma.patientVaultPayment.updateMany({
    where: { id: attempt.id, status: 'INITIATING' },
    data: { status: 'PENDING' },
  });
  return { status: 'PENDING' };
}

/**
 * Get registration details by email (for payment plan info).
 */
export async function getRegistrationDetails(email) {
  const verificationCode = await prisma.verificationCode.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      verified: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!verificationCode) return null;
  return {
    plan: verificationCode.plan,
    firstName: verificationCode.firstName,
    lastName: verificationCode.lastName,
  };
}

export async function getPatientSubscription(patientId) {
  return prisma.patientSubscription.findFirst({
    where: {
      patientId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
}
