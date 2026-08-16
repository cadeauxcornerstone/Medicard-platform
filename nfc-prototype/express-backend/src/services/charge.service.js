import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE CHARGE
|--------------------------------------------------------------------------
*/

export const createCharge = async ({
  patientId,
  encounterId,
  serviceId,
  quantity = 1,
  description,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Validate quantity
  |--------------------------------------------------------------------------
  */

  const numericQuantity = Number(quantity);

  if (
    !Number.isInteger(numericQuantity) ||
    numericQuantity <= 0
  ) {
    const error = new Error(
      "quantity must be a positive whole number"
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify patient
  |--------------------------------------------------------------------------
  */

  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId,
    },
  });

  if (!patient) {
    const error = new Error(
      "Patient not found"
    );

    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify encounter
  |--------------------------------------------------------------------------
  */

  const encounter =
    await prisma.encounter.findUnique({
      where: {
        id: encounterId,
      },
    });

  if (!encounter) {
    const error = new Error(
      "Encounter not found"
    );

    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Make sure encounter belongs to patient
  |--------------------------------------------------------------------------
  */

  if (encounter.patientId !== patientId) {
    const error = new Error(
      "Encounter does not belong to this patient"
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Find service
  |--------------------------------------------------------------------------
  */

  const service = await prisma.service.findUnique({
    where: {
      id: serviceId,
    },
  });

  if (!service) {
    const error = new Error(
      "Service not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (!service.isActive) {
    const error = new Error(
      "Service is inactive"
    );

    error.statusCode = 409;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Find CURRENT service price
  |--------------------------------------------------------------------------
  */

  const now = new Date();

  const servicePrice =
    await prisma.servicePrice.findFirst({
      where: {
        serviceId,

        isActive: true,

        effectiveFrom: {
          lte: now,
        },

        OR: [
          {
            effectiveTo: null,
          },
          {
            effectiveTo: {
              gt: now,
            },
          },
        ],
      },

      orderBy: {
        effectiveFrom: "desc",
      },
    });

  if (!servicePrice) {
    const error = new Error(
      "No active price found for this service"
    );

    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Calculate financial snapshot
  |--------------------------------------------------------------------------
  */

  const unitPrice = Number(
    servicePrice.amount
  );

  const subtotal =
    unitPrice * numericQuantity;

  /*
  |--------------------------------------------------------------------------
  | PHASE 5.2
  |
  | Insurance is not calculated yet.
  | Therefore patient responsibility is currently
  | the full subtotal.
  |--------------------------------------------------------------------------
  */

  const insuranceAmount = 0;

  const patientAmount =
    subtotal - insuranceAmount;

  /*
  |--------------------------------------------------------------------------
  | Create charge
  |--------------------------------------------------------------------------
  */

  const charge =
    await prisma.charge.create({
      data: {
        patientId,
        encounterId,
        serviceId,
        servicePriceId:
          servicePrice.id,

        quantity: numericQuantity,

        unitPrice: servicePrice.amount,

        subtotal,

        insuranceAmount,

        patientAmount,

        currency:
          servicePrice.currency,

        status: "PENDING",

        description:
          description || service.name,
      },

      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            firstName: true,
            lastName: true,
          },
        },

        encounter: {
          select: {
            id: true,
            type: true,
            status: true,
            startedAt: true,
          },
        },

        service: {
          include: {
            department: true,
          },
        },

        servicePrice: true,
      },
    });

  return charge;
};


/*
|--------------------------------------------------------------------------
| GET CHARGES BY ENCOUNTER
|--------------------------------------------------------------------------
*/

export const getChargesByEncounter =
  async (encounterId) => {
    const encounter =
      await prisma.encounter.findUnique({
        where: {
          id: encounterId,
        },
      });

    if (!encounter) {
      const error = new Error(
        "Encounter not found"
      );

      error.statusCode = 404;
      throw error;
    }

    return prisma.charge.findMany({
      where: {
        encounterId,
      },

      include: {
        service: {
          include: {
            department: true,
          },
        },

        servicePrice: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  };


/*
|--------------------------------------------------------------------------
| GET CHARGE BY ID
|--------------------------------------------------------------------------
*/

export const getChargeById =
  async (chargeId) => {
    const charge =
      await prisma.charge.findUnique({
        where: {
          id: chargeId,
        },

        include: {
          patient: true,

          encounter: true,

          service: {
            include: {
              department: true,
            },
          },

          servicePrice: true,
        },
      });

    if (!charge) {
      const error = new Error(
        "Charge not found"
      );

      error.statusCode = 404;
      throw error;
    }

    return charge;
  };