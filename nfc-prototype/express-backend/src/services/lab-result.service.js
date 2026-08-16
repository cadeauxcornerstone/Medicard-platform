import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE LAB RESULT
|--------------------------------------------------------------------------
*/

export const createLabResult = async ({
  labRequestId,
  performedById,
  testName,
  resultValue,
  unit,
  referenceRange,
  interpretation,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Verify laboratory request
  |--------------------------------------------------------------------------
  */

  const labRequest = await prisma.labRequest.findUnique({
    where: {
      id: labRequestId,
    },

    include: {
      tests: true,
    },
  });

  if (!labRequest) {
    const error = new Error(
      "Laboratory request not found"
    );

    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify laboratory provider
  |--------------------------------------------------------------------------
  */

  const provider = await prisma.user.findUnique({
    where: {
      id: performedById,
    },
  });

  if (!provider) {
    const error = new Error(
      "Laboratory provider not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (!provider.isActive) {
    const error = new Error(
      "Laboratory provider is inactive"
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify test belongs to the request
  |--------------------------------------------------------------------------
  */

  const requestedTest = labRequest.tests.find(
    (test) =>
      test.testName.toLowerCase() ===
      testName.toLowerCase()
  );

  if (!requestedTest) {
    const error = new Error(
      "This test was not requested for this laboratory request."
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Prevent duplicate active result
  |--------------------------------------------------------------------------
  */

  const existingResult =
    await prisma.labResult.findFirst({
      where: {
        labRequestId,
        testName,
        status: {
          not: "CANCELLED",
        },
      },
    });

  if (existingResult) {
    const error = new Error(
      "A result already exists for this requested test."
    );

    error.statusCode = 409;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Create result
  |--------------------------------------------------------------------------
  */

  return prisma.labResult.create({
    data: {
      labRequestId,
      performedById,

      testName,

      resultValue:
        resultValue || null,

      unit:
        unit || null,

      referenceRange:
        referenceRange || null,

      interpretation:
        interpretation || null,

      status: "COMPLETED",

      resultDate: new Date(),
    },

    include: {
      performedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },

      labRequest: {
        include: {
          tests: true,
          patient: true,
          encounter: true,
        },
      },
    },
  });
};


/*
|--------------------------------------------------------------------------
| GET RESULTS FOR LAB REQUEST
|--------------------------------------------------------------------------
*/

export const getLabResultsByRequest = async (
  labRequestId
) => {
  const labRequest =
    await prisma.labRequest.findUnique({
      where: {
        id: labRequestId,
      },
    });

  if (!labRequest) {
    const error = new Error(
      "Laboratory request not found"
    );

    error.statusCode = 404;
    throw error;
  }

  return prisma.labResult.findMany({
    where: {
      labRequestId,
    },

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

    orderBy: {
      createdAt: "desc",
    },
  });
};


/*
|--------------------------------------------------------------------------
| VERIFY LAB RESULT
|--------------------------------------------------------------------------
*/

export const verifyLabResult = async (
  labResultId
) => {
  const result =
    await prisma.labResult.findUnique({
      where: {
        id: labResultId,
      },
    });

  if (!result) {
    const error = new Error(
      "Laboratory result not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (result.status === "CANCELLED") {
    const error = new Error(
      "Cannot verify a cancelled laboratory result."
    );

    error.statusCode = 409;
    throw error;
  }

  return prisma.labResult.update({
    where: {
      id: labResultId,
    },

    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
    },

    include: {
      performedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },

      labRequest: {
        include: {
          patient: true,
          encounter: true,
        },
      },
    },
  });
};