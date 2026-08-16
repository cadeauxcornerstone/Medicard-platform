import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE DIAGNOSIS
|--------------------------------------------------------------------------
*/

export const createDiagnosis = async ({
  encounterId,
  patientId,
  recordedById,
  diagnosisType,
  code,
  description,
  notes,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Verify encounter
  |--------------------------------------------------------------------------
  */

  const encounter = await prisma.encounter.findUnique({
    where: {
      id: encounterId,
    },
  });

  if (!encounter) {
    const error = new Error("Encounter not found");
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Encounter must be open
  |--------------------------------------------------------------------------
  */

  if (encounter.status !== "OPEN") {
    const error = new Error(
      "Cannot add diagnosis to a closed encounter."
    );

    error.statusCode = 409;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify patient belongs to encounter
  |--------------------------------------------------------------------------
  */

  if (encounter.patientId !== patientId) {
    const error = new Error(
      "Diagnosis patient does not match the encounter patient."
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify provider
  |--------------------------------------------------------------------------
  */

  const provider = await prisma.user.findUnique({
    where: {
      id: recordedById,
    },
  });

  if (!provider) {
    const error = new Error(
      "Diagnosis provider not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (!provider.isActive) {
    const error = new Error(
      "Diagnosis provider is inactive"
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Create diagnosis
  |--------------------------------------------------------------------------
  */

  return prisma.diagnosis.create({
    data: {
      encounterId,
      patientId,
      recordedById,

      diagnosisType,

      code: code || null,

      description,

      notes: notes || null,
    },

    include: {
      recordedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });
};


/*
|--------------------------------------------------------------------------
| GET DIAGNOSES FOR ENCOUNTER
|--------------------------------------------------------------------------
*/

export const getDiagnosesByEncounter = async (
  encounterId
) => {
  const encounter = await prisma.encounter.findUnique({
    where: {
      id: encounterId,
    },
  });

  if (!encounter) {
    const error = new Error("Encounter not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.diagnosis.findMany({
    where: {
      encounterId,
    },

    include: {
      recordedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};