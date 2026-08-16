import prisma from "../config/database.js";

export const createOrReusePatientSession = async ({
  patientId,
  userId,
  facilityId,
  encounterId,
}) => {
  const existingSession = await prisma.patientSession.findFirst({
    where: {
      patientId,
      userId,
      facilityId,
      status: "ACTIVE",
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  if (existingSession) {
    return prisma.patientSession.update({
      where: {
        id: existingSession.id,
      },
      data: {
        encounterId,
        lastActivityAt: new Date(),
      },
    });
  }

  return prisma.patientSession.create({
    data: {
      patientId,
      userId,
      facilityId,
      encounterId,
      status: "ACTIVE",
    },
  });
};