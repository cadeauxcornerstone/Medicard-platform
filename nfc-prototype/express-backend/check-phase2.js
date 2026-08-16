import prisma from "./src/config/database.js";

const patientId = "49e0fd82-9a37-423a-a5c3-dac730679d28";

const encounters = await prisma.encounter.findMany({
  where: {
    patientId,
  },
  orderBy: {
    startedAt: "desc",
  },
});

const sessions = await prisma.patientSession.findMany({
  where: {
    patientId,
  },
  orderBy: {
    startedAt: "desc",
  },
});

console.log("\n==============================");
console.log("PHASE 2 — ENCOUNTERS");
console.log("==============================");

console.log(JSON.stringify(encounters, null, 2));

console.log("\n==============================");
console.log("PHASE 2 — PATIENT SESSIONS");
console.log("==============================");

console.log(JSON.stringify(sessions, null, 2));

await prisma.$disconnect();