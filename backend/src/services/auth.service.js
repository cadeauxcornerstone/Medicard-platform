import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../config/database.js";

const JWT_SECRET = process.env.JWT_SECRET || "medcard-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Generate JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Hash password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Staff login
 */
export async function staffLogin(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { facility: true },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!user.isActive) {
    throw new Error("Account is inactive");
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    facilityId: user.facilityId,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      facilityId: user.facilityId,
      facility: user.facility,
    },
  };
}

/**
 * Facility login
 */
export async function facilityLogin(email, password) {
  // Find admin user by email (facility login uses admin credentials)
  const adminUser = await prisma.user.findFirst({
    where: {
      email,
      role: "HOSPITAL_ADMIN",
      isActive: true,
    },
    include: { facility: true },
  });

  if (!adminUser) {
    throw new Error("Invalid facility credentials");
  }

  if (!adminUser.facility) {
    throw new Error("Facility not found");
  }

  if (adminUser.facility.status !== "ACTIVE") {
    throw new Error("Facility is not active");
  }

  const isPasswordValid = await comparePassword(password, adminUser.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid facility credentials");
  }

  const token = generateToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    facilityId: adminUser.facility.id,
  });

  return {
    token,
    facility: {
      id: adminUser.facility.id,
      name: adminUser.facility.name,
      code: adminUser.facility.code,
      email: adminUser.facility.email,
    },
    user: {
      id: adminUser.id,
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      role: adminUser.role,
    },
  };
}

/**
 * Patient login (for vault)
 */
export async function patientLogin(email, password) {
  const patient = await prisma.patient.findFirst({
    where: { email },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  if (!patient.passwordHash) {
    throw new Error("Patient account not properly configured");
  }

  const isPasswordValid = await comparePassword(password, patient.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken({
    patientId: patient.id,
    email: patient.email,
    type: "patient",
  });

  return {
    token,
    patient: {
      id: patient.id,
      patientNumber: patient.patientNumber,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
    },
  };
}

/**
 * Get user by token
 */
export async function getUserByToken(token) {
  const decoded = verifyToken(token);

  if (!decoded) {
    return null;
  }

  if (decoded.type === "patient") {
    const patient = await prisma.patient.findUnique({
      where: { id: decoded.patientId },
    });

    if (!patient) {
      return null;
    }

    return {
      type: "patient",
      ...patient,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { facility: true },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    type: "staff",
    ...user,
  };
}
