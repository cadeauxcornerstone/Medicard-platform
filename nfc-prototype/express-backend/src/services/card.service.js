import prisma from "../config/database.js";

export const createCard = async ({ cardUid, patientId, expiresAt }) => {
  const existingCard = await prisma.patientCard.findUnique({
    where: { cardUid },
  });

  if (existingCard) {
    const error = new Error("Card already exists");
    error.statusCode = 409;
    throw error;
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
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
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: {
      patient: true,
    },
  });
};

export const getCardByUid = async (cardUid) => {
  const card = await prisma.patientCard.findUnique({
    where: { cardUid },
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

export const identifyCard = async (cardUid) => {
  const card = await prisma.patientCard.findUnique({
    where: { cardUid },
    include: {
      patient: true,
    },
  });

  if (!card) {
    const error = new Error("Card not registered");
    error.statusCode = 404;
    throw error;
  }

  if (card.status !== "ACTIVE") {
    const error = new Error(`Card is ${card.status.toLowerCase()}`);
    error.statusCode = 403;
    throw error;
  }

  if (card.expiresAt && card.expiresAt < new Date()) {
    const error = new Error("Card has expired");
    error.statusCode = 403;
    throw error;
  }

  const updatedCard = await prisma.patientCard.update({
    where: { id: card.id },
    data: {
      lastUsedAt: new Date(),
    },
    include: {
      patient: true,
    },
  });

  return updatedCard;
};

export const blockCard = async (cardUid) => {
  const card = await prisma.patientCard.findUnique({
    where: { cardUid },
  });

  if (!card) {
    const error = new Error("Card not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.patientCard.update({
    where: { id: card.id },
    data: {
      status: "BLOCKED",
    },
  });
};

export const unblockCard = async (cardUid) => {
  const card = await prisma.patientCard.findUnique({
    where: { cardUid },
  });

  if (!card) {
    const error = new Error("Card not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.patientCard.update({
    where: { id: card.id },
    data: {
      status: "ACTIVE",
    },
  });
};