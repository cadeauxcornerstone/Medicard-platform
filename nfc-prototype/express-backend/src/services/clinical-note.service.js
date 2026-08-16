import prisma from "../config/database.js";

export const createClinicalNote = async ({
  encounterId,
  authorId,
  chiefComplaint,
  subjective,
  objective,
  assessment,
  plan,
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
  | Encounter must still be open
  |--------------------------------------------------------------------------
  */

  if (encounter.status !== "OPEN") {
    const error = new Error(
      "Cannot add a clinical note to a closed encounter."
    );

    error.statusCode = 409;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Verify author
  |--------------------------------------------------------------------------
  */

  const author = await prisma.user.findUnique({
    where: {
      id: authorId,
    },
  });

  if (!author) {
    const error = new Error("Clinical note author not found");
    error.statusCode = 404;
    throw error;
  }

  if (!author.isActive) {
    const error = new Error("Clinical note author is inactive");
    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Save consultation + chief complaint
  |--------------------------------------------------------------------------
  |
  | chiefComplaint belongs to Encounter.
  | SOAP information belongs to ClinicalNote.
  |
  */

  const result = await prisma.$transaction(async (tx) => {
    const updatedEncounter = await tx.encounter.update({
      where: {
        id: encounterId,
      },

      data: {
        ...(chiefComplaint !== undefined && {
          chiefComplaint: chiefComplaint || null,
        }),
      },
    });

    const clinicalNote = await tx.clinicalNote.create({
      data: {
        encounterId,
        authorId,

        subjective:
          subjective !== undefined
            ? subjective || null
            : null,

        objective:
          objective !== undefined
            ? objective || null
            : null,

        assessment:
          assessment !== undefined
            ? assessment || null
            : null,

        plan:
          plan !== undefined
            ? plan || null
            : null,
      },

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
    });

    return {
      encounter: updatedEncounter,
      clinicalNote,
    };
  });

  return result;
};


/*
|--------------------------------------------------------------------------
| Get clinical notes for an encounter
|--------------------------------------------------------------------------
*/

export const getClinicalNotesByEncounter = async (
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

  return prisma.clinicalNote.findMany({
    where: {
      encounterId,
    },

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
  });
};


/*
|--------------------------------------------------------------------------
| Get one clinical note
|--------------------------------------------------------------------------
*/

export const getClinicalNoteById = async (
  noteId
) => {
  const note = await prisma.clinicalNote.findUnique({
    where: {
      id: noteId,
    },

    include: {
      author: {
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
          chiefComplaint: true,
        },
      },
    },
  });

  if (!note) {
    const error = new Error("Clinical note not found");
    error.statusCode = 404;
    throw error;
  }

  return note;
};