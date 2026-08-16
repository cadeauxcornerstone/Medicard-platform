import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE RADIOLOGY REPORT
|--------------------------------------------------------------------------
*/

export const createRadiologyReport = async ({
  studyId,
  radiologistId,
  findings,
  impression,
  recommendations,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Verify study
  |--------------------------------------------------------------------------
  */

  const study = await prisma.radiologyStudy.findUnique({
    where: {
      id: studyId,
    },

    include: {
      radiologyRequest: true,
      report: true,
    },
  });

  if (!study) {
    const error = new Error(
      "Radiology study not found"
    );

    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Prevent duplicate report
  |--------------------------------------------------------------------------
  */

  if (study.report) {
    const error = new Error(
      "A radiology report already exists for this study."
    );

    error.statusCode = 409;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify radiologist
  |--------------------------------------------------------------------------
  */

  if (radiologistId) {
    const radiologist = await prisma.user.findUnique({
      where: {
        id: radiologistId,
      },
    });

    if (!radiologist) {
      const error = new Error(
        "Radiologist not found"
      );

      error.statusCode = 404;
      throw error;
    }

    if (!radiologist.isActive) {
      const error = new Error(
        "Radiologist is inactive"
      );

      error.statusCode = 403;
      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Validate report
  |--------------------------------------------------------------------------
  */

  if (!findings && !impression) {
    const error = new Error(
      "At least findings or impression is required."
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Create report
  |--------------------------------------------------------------------------
  */

  const report =
    await prisma.radiologyReport.create({
      data: {
        studyId,

        radiologistId:
          radiologistId || null,

        findings:
          findings || null,

        impression:
          impression || null,

        recommendations:
          recommendations || null,
      },

      include: {
        radiologist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },

        study: {
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
          },
        },
      },
    });

  /*
  |--------------------------------------------------------------------------
  | Complete radiology request
  |--------------------------------------------------------------------------
  */

  await prisma.radiologyRequest.update({
    where: {
      id: study.radiologyRequestId,
    },

    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  return report;
};


/*
|--------------------------------------------------------------------------
| GET REPORT BY STUDY
|--------------------------------------------------------------------------
*/

export const getRadiologyReportByStudy = async (
  studyId
) => {
  const study = await prisma.radiologyStudy.findUnique({
    where: {
      id: studyId,
    },
  });

  if (!study) {
    const error = new Error(
      "Radiology study not found"
    );

    error.statusCode = 404;
    throw error;
  }

  const report =
    await prisma.radiologyReport.findUnique({
      where: {
        studyId,
      },

      include: {
        radiologist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },

        study: {
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
          },
        },
      },
    });

  if (!report) {
    const error = new Error(
      "Radiology report not found"
    );

    error.statusCode = 404;
    throw error;
  }

  return report;
};