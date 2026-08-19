import prisma from "./src/config/database.js";

const cards = await prisma.patientCard.findMany({
  include: {
    patient: {
      select: {
        id: true,
        patientNumber: true,
        firstName: true,
        lastName: true,
      },
    },
  },
  orderBy: {
    createdAt: "desc",
  },
});

console.log("\n================ REGISTERED CARDS ================\n");

for (const card of cards) {
  console.log({
    cardUid: card.cardUid,
    status: card.status,
    patientId: card.patientId,
    patientNumber: card.patient?.patientNumber,
    patientName: card.patient
      ? `${card.patient.firstName} ${card.patient.lastName}`
      : null,
  });
}

await prisma.$disconnect();