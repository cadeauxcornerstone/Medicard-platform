import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| GET PHARMACY PRESCRIPTION QUEUE
|--------------------------------------------------------------------------
|
| Returns active prescriptions belonging to a facility.
|
| The facility is determined through the encounter because the current
| Prescription model does not directly contain a facilityId.
|
*/

export const getPharmacyPrescriptionQueue = async ({
  facilityId,
  search,
}) => {
  if (!facilityId) {
    const error = new Error(
      "Facility ID is required"
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify facility
  |--------------------------------------------------------------------------
  */

  const facility =
    await prisma.facility.findUnique({
      where: {
        id: facilityId,
      },
    });

  if (!facility) {
    const error = new Error(
      "Facility not found"
    );

    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Build search condition
  |--------------------------------------------------------------------------
  */

  const searchValue =
    search?.trim();

  const searchCondition =
    searchValue
      ? {
          OR: [
            {
              patient: {
                firstName: {
                  contains:
                    searchValue,
                  mode: "insensitive",
                },
              },
            },

            {
              patient: {
                lastName: {
                  contains:
                    searchValue,
                  mode: "insensitive",
                },
              },
            },

            {
              patient: {
                patientNumber: {
                  contains:
                    searchValue,
                  mode: "insensitive",
                },
              },
            },

            {
              id: {
                contains:
                  searchValue,
                mode: "insensitive",
              },
            },
          ],
        }
      : {};

  /*
  |--------------------------------------------------------------------------
  | Fetch active prescriptions
  |--------------------------------------------------------------------------
  */

  const prescriptions =
    await prisma.prescription.findMany({
      where: {
        status: "ACTIVE",

        encounter: {
          facilityId,
        },

        ...searchCondition,
      },

      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            phone: true,
          },
        },

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

      orderBy: {
        createdAt: "asc",
      },
    });

  return prescriptions;
};


/*
|--------------------------------------------------------------------------
| GET PHARMACY QUEUE SUMMARY
|--------------------------------------------------------------------------
*/

export const getPharmacyQueueSummary = async ({
  facilityId,
}) => {
  if (!facilityId) {
    const error = new Error(
      "Facility ID is required"
    );

    error.statusCode = 400;
    throw error;
  }

  const facility =
    await prisma.facility.findUnique({
      where: {
        id: facilityId,
      },
    });

  if (!facility) {
    const error = new Error(
      "Facility not found"
    );

    error.statusCode = 404;
    throw error;
  }

  const activeCount =
    await prisma.prescription.count({
      where: {
        status: "ACTIVE",

        encounter: {
          facilityId,
        },
      },
    });

  const dispensedCount =
    await prisma.prescription.count({
      where: {
        status: "DISPENSED",

        encounter: {
          facilityId,
        },
      },
    });

  const completedCount =
    await prisma.prescription.count({
      where: {
        status: "COMPLETED",

        encounter: {
          facilityId,
        },
      },
    });

  const cancelledCount =
    await prisma.prescription.count({
      where: {
        status: "CANCELLED",

        encounter: {
          facilityId,
        },
      },
    });

  return {
    active: activeCount,
    dispensed: dispensedCount,
    completed: completedCount,
    cancelled: cancelledCount,
    total:
      activeCount +
      dispensedCount +
      completedCount +
      cancelledCount,
  };
};