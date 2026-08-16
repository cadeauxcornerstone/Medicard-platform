import prisma from "../config/database.js";

import {
  getOrCreateEncounter,
} from "./encounter.service.js";

import {
  createOrReusePatientSession,
} from "./patient-session.service.js";

import {
  getPatientAccessView,
} from "./patient-access.service.js";


/*
|--------------------------------------------------------------------------
| CREATE CARD
|--------------------------------------------------------------------------
*/

export const createCard = async ({
  cardUid,
  patientId,
  expiresAt,
}) => {
  const existingCard = await prisma.patientCard.findUnique({
    where: {
      cardUid,
    },
  });

  if (existingCard) {
    const error = new Error("Card already exists");
    error.statusCode = 409;
    throw error;
  }

  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId,
    },
  });

  if (!patient) {
    const error = new Error("Patient not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.patientCard.create({
    data: {
      cardUid,
      patientId,
      expiresAt: expiresAt
        ? new Date(expiresAt)
        : null,
    },
    include: {
      patient: true,
    },
  });
};


/*
|--------------------------------------------------------------------------
| GET CARD BY UID
|--------------------------------------------------------------------------
*/

export const getCardByUid = async (cardUid) => {
  const card = await prisma.patientCard.findUnique({
    where: {
      cardUid,
    },
    include: {
      patient: true,
    },
  });

  if (!card) {
    const error = new Error("Card not found");
    error.statusCode = 404;
    throw error;
  }

  return card;
};


/*
|--------------------------------------------------------------------------
| IDENTIFY CARD
|
| NFC
|   ↓
| Patient
|   ↓
| Encounter
|   ↓
| Patient Session
|   ↓
| Role-aware patient information
|--------------------------------------------------------------------------
*/

export const identifyCard = async ({
  cardUid,
  userId,
  facilityId,
  role,
}) => {

  /*
  |--------------------------------------------------------------------------
  | Find card
  |--------------------------------------------------------------------------
  */

  const card = await prisma.patientCard.findUnique({
    where: {
      cardUid,
    },
    include: {
      patient: true,
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Card not registered
  |--------------------------------------------------------------------------
  */

  if (!card) {
    const error = new Error("Card not registered");
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Card blocked / inactive
  |--------------------------------------------------------------------------
  */

  if (card.status !== "ACTIVE") {
    const error = new Error(
      `Card is ${card.status.toLowerCase()}`
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Card expired
  |--------------------------------------------------------------------------
  */

  if (
    card.expiresAt &&
    card.expiresAt < new Date()
  ) {
    const error = new Error("Card has expired");

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Update last card usage
  |--------------------------------------------------------------------------
  */

  const updatedCard = await prisma.patientCard.update({
    where: {
      id: card.id,
    },

    data: {
      lastUsedAt: new Date(),
    },

    include: {
      patient: true,
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Create or reuse encounter
  |--------------------------------------------------------------------------
  */

  const encounter = await getOrCreateEncounter({
    patientId: updatedCard.patient.id,
    userId,
    facilityId,
  });

  /*
  |--------------------------------------------------------------------------
  | Create or reuse patient session
  |--------------------------------------------------------------------------
  */

  const session = await createOrReusePatientSession({
    patientId: updatedCard.patient.id,
    userId,
    facilityId,
    encounterId: encounter.id,
  });

  /*
  |--------------------------------------------------------------------------
  | Apply role-based patient access
  |--------------------------------------------------------------------------
  */

  const patient = getPatientAccessView(
    updatedCard.patient,
    role
  );

  /*
  |--------------------------------------------------------------------------
  | Return Phase 2 patient context
  |--------------------------------------------------------------------------
  */

  return {
    card: {
      id: updatedCard.id,
      cardUid: updatedCard.cardUid,
      status: updatedCard.status,
      lastUsedAt: updatedCard.lastUsedAt,
    },

    patient,

    encounter: {
      id: encounter.id,
      status: encounter.status,
      type: encounter.type,
      startedAt: encounter.startedAt,
    },

    session: {
      id: session.id,
      status: session.status,
      startedAt: session.startedAt,
      lastActivityAt: session.lastActivityAt,
    },
  };
};


/*
|--------------------------------------------------------------------------
| BLOCK CARD
|--------------------------------------------------------------------------
*/

export const blockCard = async (cardUid) => {
  const card = await prisma.patientCard.findUnique({
    where: {
      cardUid,
    },
  });

  if (!card) {
    const error = new Error("Card not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.patientCard.update({
    where: {
      id: card.id,
    },

    data: {
      status: "BLOCKED",
    },
  });
};


/*
|--------------------------------------------------------------------------
| UNBLOCK CARD
|--------------------------------------------------------------------------
*/

export const unblockCard = async (cardUid) => {
  const card = await prisma.patientCard.findUnique({
    where: {
      cardUid,
    },
  });

  if (!card) {
    const error = new Error("Card not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.patientCard.update({
    where: {
      id: card.id,
    },

    data: {
      status: "ACTIVE",
    },
  });
};