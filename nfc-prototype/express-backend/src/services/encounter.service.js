
import prisma from "../config/database.js";


/*
|--------------------------------------------------------------------------
| GET OR CREATE ENCOUNTER
|--------------------------------------------------------------------------
*/

export const getOrCreateEncounter = async ({
  patientId,
  userId,
  facilityId,
  type = "GENERAL",
}) => {
  /*
  |--------------------------------------------------------------------------
  | Look for existing active encounter
  |--------------------------------------------------------------------------
  */

  const existingEncounter =
    await prisma.encounter.findFirst({
      where: {
        patientId,
        facilityId,

        status: {
          in: [
            "OPEN",
            "IN_PROGRESS",
          ],
        },
      },

      orderBy: {
        startedAt: "desc",
      },
    });

  if (existingEncounter) {
    return existingEncounter;
  }

  /*
  |--------------------------------------------------------------------------
  | Create new encounter
  |--------------------------------------------------------------------------
  */

  return prisma.encounter.create({
    data: {
      patientId,
      facilityId,
      providerId: userId,
      type,
      status: "OPEN",
    },
  });
};


/*
|--------------------------------------------------------------------------
| GET ENCOUNTER BY ID
|--------------------------------------------------------------------------
|
| Returns the complete clinical picture for the encounter.
|
*/

export const getEncounterById =
  async (encounterId) => {
    const encounter =
      await prisma.encounter.findUnique({
        where: {
          id: encounterId,
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
              email: true,
            },
          },

          facility: {
            select: {
              id: true,
              name: true,
            },
          },

          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },

          clinicalNotes: {
            include: {
              author: {
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
          },

          diagnoses: {
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
          },

          prescriptions: {
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
          },

          labRequests: {
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
          },

          radiologyRequests: {
            include: {
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
          },

          charges: true,
        },
      });

    if (!encounter) {
      const error = new Error(
        "Encounter not found"
      );

      error.statusCode = 404;

      throw error;
    }

    return encounter;
  };


/*
|--------------------------------------------------------------------------
| COMPLETE ENCOUNTER
|--------------------------------------------------------------------------
*/

export const completeEncounter =
  async ({
    encounterId,
    completedById,
  }) => {
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

        include: {
          patient: true,

          prescriptions: {
            select: {
              id: true,
              status: true,
            },
          },

          labRequests: {
            select: {
              id: true,
              status: true,
            },
          },

          radiologyRequests: {
            select: {
              id: true,
              status: true,
            },
          },
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
    | Already completed
    |--------------------------------------------------------------------------
    */

    if (
      encounter.status ===
      "COMPLETED"
    ) {
      const error = new Error(
        "Encounter has already been completed."
      );

      error.statusCode = 409;

      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | Cancelled encounters cannot be completed
    |--------------------------------------------------------------------------
    */

    if (
      encounter.status ===
      "CANCELLED"
    ) {
      const error = new Error(
        "A cancelled encounter cannot be completed."
      );

      error.statusCode = 409;

      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | Verify completing provider
    |--------------------------------------------------------------------------
    */

    const provider =
      await prisma.user.findUnique({
        where: {
          id: completedById,
        },
      });

    if (!provider) {
      const error = new Error(
        "Encounter completion provider not found"
      );

      error.statusCode = 404;

      throw error;
    }

    if (!provider.isActive) {
      const error = new Error(
        "Encounter completion provider is inactive"
      );

      error.statusCode = 403;

      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | Check outstanding laboratory work
    |--------------------------------------------------------------------------
    */

    const pendingLabRequests =
      encounter.labRequests.filter(
        (request) =>
          request.status !==
            "COMPLETED" &&
          request.status !==
            "CANCELLED"
      );

    /*
    |--------------------------------------------------------------------------
    | Check outstanding radiology work
    |--------------------------------------------------------------------------
    */

    const pendingRadiologyRequests =
      encounter.radiologyRequests.filter(
        (request) =>
          request.status !==
            "COMPLETED" &&
          request.status !==
            "CANCELLED"
      );

    /*
    |--------------------------------------------------------------------------
    | Check active prescriptions
    |--------------------------------------------------------------------------
    |
    | An ACTIVE prescription means it has not yet been dispensed.
    |
    | We don't block completion because the clinical encounter can
    | legitimately finish while the patient continues to pharmacy.
    |
    */

    const activePrescriptions =
      encounter.prescriptions.filter(
        (prescription) =>
          prescription.status ===
          "ACTIVE"
      );

    /*
    |--------------------------------------------------------------------------
    | Block completion if investigations are still pending
    |--------------------------------------------------------------------------
    |
    | This prevents a provider from accidentally closing an encounter
    | while requested investigations are still actively processing.
    |
    */

    if (
      pendingLabRequests.length >
        0 ||
      pendingRadiologyRequests.length >
        0
    ) {
      const error = new Error(
        "Encounter has pending laboratory or radiology requests."
      );

      error.statusCode = 409;

      error.details = {
        pendingLaboratoryRequests:
          pendingLabRequests.map(
            (request) =>
              request.id
          ),

        pendingRadiologyRequests:
          pendingRadiologyRequests.map(
            (request) =>
              request.id
          ),

        activePrescriptions:
          activePrescriptions.map(
            (prescription) =>
              prescription.id
          ),
      };

      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | Complete encounter
    |--------------------------------------------------------------------------
    */

    const completedEncounter =
      await prisma.encounter.update({
        where: {
          id: encounterId,
        },

        data: {
          status: "COMPLETED",

          completedAt:
            new Date(),
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

          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

    return {
      encounter:
        completedEncounter,

      completionSummary: {
        completedBy: {
          id: provider.id,
          firstName:
            provider.firstName,
          lastName:
            provider.lastName,
          role: provider.role,
        },

        completedAt:
          completedEncounter.completedAt,

        pendingLaboratoryRequests:
          pendingLabRequests.length,

        pendingRadiologyRequests:
          pendingRadiologyRequests.length,

        activePrescriptions:
          activePrescriptions.length,
      },
    };
  };