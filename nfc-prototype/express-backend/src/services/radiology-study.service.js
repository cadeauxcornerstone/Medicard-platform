import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE RADIOLOGY STUDY
|--------------------------------------------------------------------------
*/

export const createRadiologyStudy = async ({
  radiologyRequestId,
  studyType,
  imageUrl,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Verify request
  |--------------------------------------------------------------------------
  */

  const request = await prisma.radiologyRequest.findUnique({
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

  /*
  |--------------------------------------------------------------------------
  | Request must not be cancelled
  |--------------------------------------------------------------------------
  */

  if (request.status === "CANCELLED") {
    const error = new Error(
      "Cannot create a study for a cancelled radiology request."
    );

    error.statusCode = 409;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Validate study type
  |--------------------------------------------------------------------------
  */

  if (!studyType) {
    const error = new Error(
      "Study type is required."
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Create study
  |--------------------------------------------------------------------------
  */

  const study = await prisma.radiologyStudy.create({
    data: {
      radiologyRequestId,

      studyType,

      performedAt: new Date(),

      imageUrl: imageUrl || null,
    },

    include: {
      radiologyRequest: {
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
        },
      },

      report: true,
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Move request to IN_PROGRESS
  |--------------------------------------------------------------------------
  */

  if (
    request.status === "REQUESTED" ||
    request.status === "SCHEDULED"
  ) {
    await prisma.radiologyRequest.update({
      where: {
        id: radiologyRequestId,
      },

      data: {
        status: "IN_PROGRESS",
      },
    });
  }

  return study;
};


/*
|--------------------------------------------------------------------------
| GET STUDIES FOR REQUEST
|--------------------------------------------------------------------------
*/

export const getStudiesByRequest = async (
  radiologyRequestId
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

  return prisma.radiologyStudy.findMany({
    where: {
      radiologyRequestId,
    },

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

    orderBy: {
      createdAt: "desc",
    },
  });
};


/*
|--------------------------------------------------------------------------
| GET ONE STUDY
|--------------------------------------------------------------------------
*/

export const getRadiologyStudyById = async (
  studyId
) => {
  const study =
    await prisma.radiologyStudy.findUnique({
      where: {
        id: studyId,
      },

      include: {
        radiologyRequest: {
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
          },
        },

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
    });

  if (!study) {
    const error = new Error(
      "Radiology study not found"
    );

    error.statusCode = 404;
    throw error;
  }

  return study;
};