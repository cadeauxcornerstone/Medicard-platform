import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE PRESCRIPTION
|--------------------------------------------------------------------------
|
| One prescription can contain multiple medication items.
|
*/

export const createPrescription = async ({
  encounterId,
  patientId,
  prescribedById,
  notes,
  items,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Validate encounter
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

  if (encounter.status !== "OPEN") {
    const error = new Error(
      "Cannot create a prescription for a closed encounter."
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
      "Prescription patient does not match the encounter patient."
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify prescriber
  |--------------------------------------------------------------------------
  */

  const prescriber = await prisma.user.findUnique({
    where: {
      id: prescribedById,
    },
  });

  if (!prescriber) {
    const error = new Error(
      "Prescribing provider not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (!prescriber.isActive) {
    const error = new Error(
      "Prescribing provider is inactive"
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Validate medication items
  |--------------------------------------------------------------------------
  */

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error(
      "At least one medication is required."
    );

    error.statusCode = 400;
    throw error;
  }

  for (const item of items) {
    if (!item.medicationName) {
      const error = new Error(
        "Every prescription item must have a medication name."
      );

      error.statusCode = 400;
      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Create prescription + medication items atomically
  |--------------------------------------------------------------------------
  */

  const prescription =
    await prisma.prescription.create({
      data: {
        patientId,
        encounterId,
        prescribedById,
        status: "ACTIVE",
        notes: notes || null,

        items: {
          create: items.map((item) => ({
            medicationName: item.medicationName,
            dosage: item.dosage || null,
            frequency: item.frequency || null,
            duration: item.duration || null,
            quantity: item.quantity || null,
            instructions: item.instructions || null,
          })),
        },
      },

      include: {
        items: true,

        prescribedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

  return prescription;
};


/*
|--------------------------------------------------------------------------
| GET PRESCRIPTIONS FOR ENCOUNTER
|--------------------------------------------------------------------------
*/

export const getPrescriptionsByEncounter = async (
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

  return prisma.prescription.findMany({
    where: {
      encounterId,
    },

    include: {
      items: true,

      prescribedBy: {
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


/*
|--------------------------------------------------------------------------
| GET ONE PRESCRIPTION
|--------------------------------------------------------------------------
*/

export const getPrescriptionById = async (
  prescriptionId
) => {
  const prescription =
    await prisma.prescription.findUnique({
      where: {
        id: prescriptionId,
      },

      include: {
        items: true,

        prescribedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },

        encounter: {
          select: {
            id: true,
            patientId: true,
            facilityId: true,
            status: true,
            startedAt: true,
          },
        },
      },
    });

  if (!prescription) {
    const error = new Error(
      "Prescription not found"
    );

    error.statusCode = 404;
    throw error;
  }

  return prescription;
};


/*
|--------------------------------------------------------------------------
| UPDATE PRESCRIPTION STATUS
|--------------------------------------------------------------------------
*/

export const updatePrescriptionStatus = async (
  prescriptionId,
  status
) => {
  const prescription =
    await prisma.prescription.findUnique({
      where: {
        id: prescriptionId,
      },
    });

  if (!prescription) {
    const error = new Error(
      "Prescription not found"
    );

    error.statusCode = 404;
    throw error;
  }

  const allowedStatuses = [
    "ACTIVE",
    "DISPENSED",
    "CANCELLED",
    "COMPLETED",
  ];

  if (!allowedStatuses.includes(status)) {
    const error = new Error(
      "Invalid prescription status."
    );

    error.statusCode = 400;
    throw error;
  }

  return prisma.prescription.update({
    where: {
      id: prescriptionId,
    },

    data: {
      status,
    },

    include: {
      items: true,
    },
  });
};