import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE LAB REQUEST
|--------------------------------------------------------------------------
|
| One request can contain multiple laboratory tests.
|
*/

export const createLabRequest = async ({
  encounterId,
  patientId,
  requestedById,
  clinicalIndication,
  notes,
  tests,
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
      "Cannot create a laboratory request for a closed encounter."
    );

    error.statusCode = 409;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify patient
  |--------------------------------------------------------------------------
  */

  if (encounter.patientId !== patientId) {
    const error = new Error(
      "Laboratory request patient does not match the encounter patient."
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
  | Validate tests
  |--------------------------------------------------------------------------
  */

  if (!Array.isArray(tests) || tests.length === 0) {
    const error = new Error(
      "At least one laboratory test is required."
    );

    error.statusCode = 400;
    throw error;
  }

  for (const test of tests) {
    if (!test.testName) {
      const error = new Error(
        "Every laboratory test must have a test name."
      );

      error.statusCode = 400;
      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Create request + tests
  |--------------------------------------------------------------------------
  */

  return prisma.labRequest.create({
    data: {
      patientId,
      encounterId,
      requestedById,

      status: "REQUESTED",

      clinicalIndication:
        clinicalIndication || null,

      notes: notes || null,

      tests: {
        create: tests.map((test) => ({
          testName: test.testName,
          testCode: test.testCode || null,
        })),
      },
    },

    include: {
      tests: true,

      requestedBy: {
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
| GET LAB REQUESTS FOR ENCOUNTER
|--------------------------------------------------------------------------
*/

export const getLabRequestsByEncounter = async (
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

  return prisma.labRequest.findMany({
    where: {
      encounterId,
    },

    include: {
      tests: true,

      results: true,

      requestedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
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
| GET ONE LAB REQUEST
|--------------------------------------------------------------------------
*/

export const getLabRequestById = async (
  labRequestId
) => {
  const request =
    await prisma.labRequest.findUnique({
      where: {
        id: labRequestId,
      },

      include: {
        tests: true,

        results: {
          include: {
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },

        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },

        patient: true,

        encounter: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    });

  if (!request) {
    const error = new Error(
      "Laboratory request not found"
    );

    error.statusCode = 404;
    throw error;
  }

  return request;
};


/*
|--------------------------------------------------------------------------
| UPDATE LAB REQUEST STATUS
|--------------------------------------------------------------------------
*/

export const updateLabRequestStatus = async (
  labRequestId,
  status
) => {
  const request =
    await prisma.labRequest.findUnique({
      where: {
        id: labRequestId,
      },
    });

  if (!request) {
    const error = new Error(
      "Laboratory request not found"
    );

    error.statusCode = 404;
    throw error;
  }

  const allowedStatuses = [
    "REQUESTED",
    "SAMPLE_COLLECTED",
    "PROCESSING",
    "COMPLETED",
    "CANCELLED",
  ];

  if (!allowedStatuses.includes(status)) {
    const error = new Error(
      "Invalid laboratory request status."
    );

    error.statusCode = 400;
    throw error;
  }

  const completedAt =
    status === "COMPLETED"
      ? new Date()
      : request.completedAt;

  return prisma.labRequest.update({
    where: {
      id: labRequestId,
    },

    data: {
      status,
      completedAt,
    },

    include: {
      tests: true,
      results: true,
    },
  });
};