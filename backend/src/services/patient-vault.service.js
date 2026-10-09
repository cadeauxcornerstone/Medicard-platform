import { randomUUID } from "node:crypto";
import prisma from "../config/database.js";

function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}
async function assertOwnedProfile(ownerId, profileId) {
  if (ownerId === profileId) {
    const patient = await prisma.patient.findUnique({ where: { id: ownerId } });
    if (!patient) throw notFound("Patient profile not found");
    return patient;
  }

  const dependent = await prisma.patient.findFirst({
    where: { id: profileId, guardianId: ownerId },
  });
  if (!dependent) throw notFound("Dependent profile not found");
  return dependent;
}

const profileSelect = {
  id: true,
  patientNumber: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  phone: true,
  email: true,
  nationalId: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  insuranceProvider: true,
  guardianId: true,
  allergies: { orderBy: { createdAt: "desc" } },
  medicalConditions: { orderBy: { createdAt: "desc" } },
  medicalDocuments: {
    select: { id: true, title: true, description: true, type: true, mimeType: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  },
  patientInsurances: {
    select: {
      id: true,
      membershipNumber: true,
      status: true,
      validFrom: true,
      validTo: true,
      plan: { select: { name: true, provider: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  },
  cards: { select: { id: true, status: true, lastUsedAt: true }, orderBy: { createdAt: "desc" } },
};

export async function getVaultDashboard(ownerId) {
  const [patient, subscription] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: ownerId },
      select: {
        ...profileSelect,
        dependents: {
          select: profileSelect,
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        },
      },
    }),
    prisma.patientSubscription.findFirst({
      where: { patientId: ownerId, status: "ACTIVE", endDate: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!patient) throw notFound("Patient profile not found");
  return { patient, subscription };
}

export async function updateVaultProfile(ownerId, profileId, input) {
  await assertOwnedProfile(ownerId, profileId);
  const allowed = [
    "firstName",
    "lastName",
    "dateOfBirth",
    "gender",
    "phone",
    "nationalId",
    "emergencyContactName",
    "emergencyContactPhone",
    "insuranceProvider",
  ];
  const data = {};
  for (const field of allowed) {
    if (input[field] !== undefined) data[field] = input[field] || null;
  }
  for (const field of ["firstName", "lastName"]) {
    if (data[field] !== undefined) {
      if (typeof data[field] !== "string" || !data[field].trim()) {
        const error = new Error(`${field === "firstName" ? "First" : "Last"} name is required`);
        error.statusCode = 400;
        throw error;
      }
      data[field] = data[field].trim();
    }
  }
  if (data.gender !== undefined && !["MALE", "FEMALE", "OTHER", "UNKNOWN"].includes(data.gender)) {
    const error = new Error("Gender is invalid");
    error.statusCode = 400;
    throw error;
  }
  if (data.dateOfBirth) {
    data.dateOfBirth = parseDate(data.dateOfBirth);
  }
  return prisma.patient.update({
    where: { id: profileId },
    data,
    select: profileSelect,
  });
}

export async function createDependent(ownerId, input) {
  const parent = await prisma.patient.findUnique({ where: { id: ownerId } });
  if (!parent) throw notFound("Parent profile not found");

  if (
    typeof input.firstName !== "string"
    || !input.firstName.trim()
    || typeof input.lastName !== "string"
    || !input.lastName.trim()
  ) {
    const error = new Error("First and last name are required");
    error.statusCode = 400;
    throw error;
  }
  if (input.gender && !["MALE", "FEMALE", "OTHER", "UNKNOWN"].includes(input.gender)) {
    const error = new Error("Gender is invalid");
    error.statusCode = 400;
    throw error;
  }

  const patientNumber = `DEP-${randomUUID()}`;
  return prisma.patient.create({
    data: {
      patientNumber,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      dateOfBirth: input.dateOfBirth ? parseDate(input.dateOfBirth) : null,
      gender: input.gender || "UNKNOWN",
      nationalId: input.nationalId?.trim() || null,
      phone: input.phone?.trim() || null,
      emergencyContactName: input.emergencyContactName?.trim() || `${parent.firstName} ${parent.lastName}`,
      emergencyContactPhone: input.emergencyContactPhone?.trim() || parent.phone,
      insuranceProvider: input.insuranceProvider?.trim() || null,
      guardianId: ownerId,
    },
    select: profileSelect,
  });
}

export async function addVaultAllergy(ownerId, profileId, input) {
  await assertOwnedProfile(ownerId, profileId);
  if (typeof input.allergen !== "string" || !input.allergen.trim()) {
    const error = new Error("Allergen is required");
    error.statusCode = 400;
    throw error;
  }
  return prisma.allergy.create({
    data: {
      patientId: profileId,
      allergen: input.allergen.trim(),
      reaction: input.reaction?.trim() || null,
      severity: input.severity?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });
}

export async function addVaultCondition(ownerId, profileId, input) {
  await assertOwnedProfile(ownerId, profileId);
  if (typeof input.name !== "string" || !input.name.trim()) {
    const error = new Error("Condition name is required");
    error.statusCode = 400;
    throw error;
  }
  return prisma.medicalCondition.create({
    data: {
      patientId: profileId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      diagnosedAt: input.diagnosedAt ? parseDate(input.diagnosedAt) : null,
      isActive: true,
    },
  });
}

function parseDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error("Date is invalid");
    error.statusCode = 400;
    throw error;
  }
  return date;
}

export async function removeVaultHealthItem(ownerId, profileId, itemId, kind) {
  await assertOwnedProfile(ownerId, profileId);
  if (!["allergy", "condition"].includes(kind)) {
    const error = new Error("Health record type is invalid");
    error.statusCode = 400;
    throw error;
  }
  const model = kind === "allergy" ? prisma.allergy : prisma.medicalCondition;
  const item = await model.findFirst({ where: { id: itemId, patientId: profileId } });
  if (!item) throw notFound("Health record not found");
  await model.delete({ where: { id: itemId } });
}
