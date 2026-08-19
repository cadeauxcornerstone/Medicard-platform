import prisma from "./src/config/database.js";

const patients = await prisma.patient.findMany({
  take: 10,
  orderBy: {
    createdAt: "desc",
  },
  select: {
    id: true,
    patientNumber: true,
    firstName: true,
    lastName: true,
  },
});

const facilities = await prisma.facility.findMany({
  take: 10,
  select: {
    id: true,
    name: true,
  },
});

const charges = await prisma.charge.findMany({
  take: 20,
  orderBy: {
    createdAt: "desc",
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

    encounter: {
      select: {
        id: true,
        facilityId: true,
      },
    },

    service: {
      select: {
        id: true,
        name: true,
      },
    },

    payments: {
      select: {
        id: true,
        amount: true,
        status: true,
      },
    },
  },
});

console.log("\n================ PATIENTS ================\n");
console.table(patients);

console.log("\n================ FACILITIES ================\n");
console.table(facilities);

console.log("\n================ CHARGES ================\n");

for (const charge of charges) {
  console.log({
    chargeId: charge.id,
    patientId: charge.patientId,
    patientNumber: charge.patient.patientNumber,
    patientName:
      `${charge.patient.firstName} ${charge.patient.lastName}`,
    facilityId: charge.encounter.facilityId,
    service: charge.service.name,
    patientAmount: charge.patientAmount.toString(),
    status: charge.status,
    payments: charge.payments,
  });
}

await prisma.$disconnect();