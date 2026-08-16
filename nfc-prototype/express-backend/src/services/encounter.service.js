import prisma from "../config/database.js";

export const getOrCreateEncounter = async ({
  patientId,
  userId,
  facilityId,
  type = "GENERAL",
}) => {
  /*
   * Look for an existing active encounter
   * for this patient at this facility.
   */
  const existingEncounter = await prisma.encounter.findFirst({
    where: {
      patientId,
      facilityId,
      status: {
        in: ["OPEN", "IN_PROGRESS"],
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
   * No active encounter exists.
   * Create a new one.
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