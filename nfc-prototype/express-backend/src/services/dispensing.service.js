import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE DISPENSING RECORD
|--------------------------------------------------------------------------
|
| This performs the actual pharmacy dispensing transaction.
|
| 1. Verify prescription
| 2. Verify prescription is ACTIVE
| 3. Verify pharmacist
| 4. Verify facility
| 5. Create dispensing record
| 6. Create dispensing items
| 7. Mark prescription as DISPENSED
|
*/

export const dispensePrescription = async ({
  prescriptionId,
  dispensedById,
  facilityId,
  items,
  notes,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Basic validation
  |--------------------------------------------------------------------------
  */

  if (!prescriptionId) {
    const error = new Error(
      "Prescription ID is required"
    );

    error.statusCode = 400;
    throw error;
  }

  if (!dispensedById) {
    const error = new Error(
      "Dispensing pharmacist is required"
    );

    error.statusCode = 400;
    throw error;
  }

  if (!facilityId) {
    const error = new Error(
      "Facility ID is required"
    );

    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error(
      "At least one dispensing item is required"
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify pharmacist
  |--------------------------------------------------------------------------
  */

  const pharmacist = await prisma.user.findUnique({
    where: {
      id: dispensedById,
    },
  });

  if (!pharmacist) {
    const error = new Error(
      "Dispensing pharmacist not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (!pharmacist.isActive) {
    const error = new Error(
      "Dispensing pharmacist is inactive"
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Load prescription
  |--------------------------------------------------------------------------
  */

  const prescription =
    await prisma.prescription.findUnique({
      where: {
        id: prescriptionId,
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

        items: true,

        encounter: {
          select: {
            id: true,
            patientId: true,
            facilityId: true,
            status: true,
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

  /*
  |--------------------------------------------------------------------------
  | Verify prescription status
  |--------------------------------------------------------------------------
  */

  if (prescription.status !== "ACTIVE") {
    const error = new Error(
      `Prescription cannot be dispensed because its current status is ${prescription.status}.`
    );

    error.statusCode = 409;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify prescription belongs to facility
  |--------------------------------------------------------------------------
  */

  if (
    prescription.encounter.facilityId !==
    facilityId
  ) {
    const error = new Error(
      "Prescription does not belong to this facility."
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify requested dispensing items
  |--------------------------------------------------------------------------
  */

  const prescriptionItemIds =
    new Set(
      prescription.items.map(
        (item) => item.id
      )
    );

  for (const item of items) {
    if (!item.prescriptionItemId) {
      const error = new Error(
        "Each dispensing item must include prescriptionItemId."
      );

      error.statusCode = 400;
      throw error;
    }

    if (
      !prescriptionItemIds.has(
        item.prescriptionItemId
      )
    ) {
      const error = new Error(
        "A dispensing item does not belong to this prescription."
      );

      error.statusCode = 400;
      throw error;
    }

    if (
      !item.quantityDispensed ||
      !String(
        item.quantityDispensed
      ).trim()
    ) {
      const error = new Error(
        "Quantity dispensed is required for every medication."
      );

      error.statusCode = 400;
      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Prevent duplicate medication entries
  |--------------------------------------------------------------------------
  */

  const uniqueItemIds =
    new Set();

  for (const item of items) {
    if (
      uniqueItemIds.has(
        item.prescriptionItemId
      )
    ) {
      const error = new Error(
        "The same prescription item cannot be dispensed more than once in the same transaction."
      );

      error.statusCode = 400;
      throw error;
    }

    uniqueItemIds.add(
      item.prescriptionItemId
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Create dispensing transaction
  |--------------------------------------------------------------------------
  */

  const result =
    await prisma.$transaction(
      async (tx) => {
        /*
        |--------------------------------------------------------------------------
        | Re-check prescription inside transaction
        |--------------------------------------------------------------------------
        */

        const currentPrescription =
          await tx.prescription.findUnique({
            where: {
              id: prescriptionId,
            },

            select: {
              id: true,
              status: true,
            },
          });

        if (!currentPrescription) {
          const error = new Error(
            "Prescription not found"
          );

          error.statusCode = 404;
          throw error;
        }

        if (
          currentPrescription.status !==
          "ACTIVE"
        ) {
          const error = new Error(
            "Prescription has already been processed."
          );

          error.statusCode = 409;
          throw error;
        }

        /*
        |--------------------------------------------------------------------------
        | Create dispensing record
        |--------------------------------------------------------------------------
        */

        const dispensingRecord =
          await tx.dispensingRecord.create({
            data: {
              prescriptionId,
              dispensedById,
              notes:
                notes?.trim() ||
                null,

              items: {
                create: items.map(
                  (item) => ({
                    prescriptionItemId:
                      item.prescriptionItemId,

                    quantityDispensed:
                      String(
                        item.quantityDispensed
                      ).trim(),
                  })
                ),
              },
            },

            include: {
              dispensedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },

              items: {
                include: {
                  prescriptionItem: true,
                },
              },
            },
          });

        /*
        |--------------------------------------------------------------------------
        | Update prescription status
        |--------------------------------------------------------------------------
        */

        const updatedPrescription =
          await tx.prescription.update({
            where: {
              id: prescriptionId,
            },

            data: {
              status: "DISPENSED",
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

        return {
          dispensingRecord,
          prescription:
            updatedPrescription,
        };
      }
    );

  return result;
};


/*
|--------------------------------------------------------------------------
| GET DISPENSING RECORDS FOR PRESCRIPTION
|--------------------------------------------------------------------------
*/

export const getDispensingRecordsByPrescription =
  async (
    prescriptionId
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

    return prisma.dispensingRecord.findMany({
      where: {
        prescriptionId,
      },

      include: {
        dispensedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },

        items: {
          include: {
            prescriptionItem: true,
          },
        },
      },

      orderBy: {
        dispensedAt: "desc",
      },
    });
  };