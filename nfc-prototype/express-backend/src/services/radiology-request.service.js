import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE RADIOLOGY REQUEST
|--------------------------------------------------------------------------
*/

export const createRadiologyRequest = async ({
  encounterId,
  patientId,
  requestedById,
  examinationType,
  clinicalIndication,
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
      "Cannot create a radiology request for a closed encounter."
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
      "Radiology request patient does not match the encounter patient."
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify requesting provider
  |--------------------------------------------------------------------------
  */

  const provider = await prisma.user.findUnique({
    where: {
      id: requestedById,
    },
  });

  if (!provider) {
    const error = new Error(
      "Requesting provider not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (!provider.isActive) {
    const error = new Error(
      "Requesting provider is inactive"
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Validate examination
  |--------------------------------------------------------------------------
  */

  if (!examinationType) {
    const error = new Error(
      "Examination type is required."
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Create radiology request
  |--------------------------------------------------------------------------
  */

  return prisma.radiologyRequest.create({
    data: {
      patientId,
      encounterId,
      requestedById,

      status: "REQUESTED",

      examinationType,

      clinicalIndication:
        clinicalIndication || null,

      notes:
        notes || null,
    },

    include: {
      requestedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },

      patient: true,

      studies: {
        include: {
          report: true,
        },
      },
    },
  });
};


/*
|--------------------------------------------------------------------------
| GET RADIOLOGY REQUESTS FOR ENCOUNTER
|--------------------------------------------------------------------------
*/

export const getRadiologyRequestsByEncounter =
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

    return prisma.radiologyRequest.findMany({
      where: {
        encounterId,
      },

      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },

        studies: {
          include: {
            report: true,
          },
        },
      },

      orderBy: {
        requestedAt: "desc",
      },
    });
  };


/*
|--------------------------------------------------------------------------
| GET ONE RADIOLOGY REQUEST
|--------------------------------------------------------------------------
*/

export const getRadiologyRequestById =
  async (radiologyRequestId) => {
    const request =
      await prisma.radiologyRequest.findUnique({
        where: {
          id: radiologyRequestId,
        },

        include: {
          patient: true,

          requestedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },

          studies: {
            include: {
              report: {
                include: {
                  radiologist: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      role: true,
                    },
                  },
                },
              },
            },
          },

          encounter: {
            select: {
              id: true,
              patientId: true,
              facilityId: true,
              status: true,
              startedAt: true,
              completedAt: true,
            },
          },
        },
      });

    if (!request) {
      const error = new Error(
        "Radiology request not found"
      );

      error.statusCode = 404;
      throw error;
    }

    return request;
  };


/*
|--------------------------------------------------------------------------
| UPDATE RADIOLOGY REQUEST STATUS
|--------------------------------------------------------------------------
*/

export const updateRadiologyRequestStatus =
  async (
    radiologyRequestId,
    status
  ) => {
    const request =
      await prisma.radiologyRequest.findUnique({
        where: {
          id: radiologyRequestId,
        },
      });

    if (!request) {
      const error = new Error(
        "Radiology request not found"
      );

      error.statusCode = 404;
      throw error;
    }

    const allowedStatuses = [
      "REQUESTED",
      "SCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      const error = new Error(
        "Invalid radiology request status."
      );

      error.statusCode = 400;
      throw error;
    }

    const completedAt =
      status === "COMPLETED"
        ? new Date()
        : request.completedAt;

    return prisma.radiologyRequest.update({
      where: {
        id: radiologyRequestId,
      },

      data: {
        status,
        completedAt,
      },

      include: {
        studies: {
          include: {
            report: true,
          },
        },
      },
    });
  };