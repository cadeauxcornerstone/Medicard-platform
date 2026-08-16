import prisma from "../config/database.js";

export const createPatient = async (data) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    phone,
    email
  } = data;

  const patientNumber = await generatePatientNumber();

  return prisma.patient.create({
    data: {
      patientNumber,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || "UNKNOWN",
      phone: phone || null,
      email: email || null
    }
  });
};

export const getPatients = async ({ page = 1, limit = 20, search }) => {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          {
            firstName: {
              contains: search,
              mode: "insensitive"
            }
          },
          {
            lastName: {
              contains: search,
              mode: "insensitive"
            }
          },
          {
            patientNumber: {
              contains: search,
              mode: "insensitive"
            }
          },
          {
            phone: {
              contains: search,
              mode: "insensitive"
            }
          }
        ]
      }
    : {};

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc"
      }
    }),

    prisma.patient.count({ where })
  ]);

  return {
    patients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getPatientById = async (id) => {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      cards: true
    }
  });
};

export const updatePatient = async (id, data) => {
  const updateData = {};

  if (data.firstName !== undefined) {
    updateData.firstName = data.firstName;
  }

  if (data.lastName !== undefined) {
    updateData.lastName = data.lastName;
  }

  if (data.dateOfBirth !== undefined) {
    updateData.dateOfBirth = data.dateOfBirth
      ? new Date(data.dateOfBirth)
      : null;
  }

  if (data.gender !== undefined) {
    updateData.gender = data.gender;
  }

  if (data.phone !== undefined) {
    updateData.phone = data.phone || null;
  }

  if (data.email !== undefined) {
    updateData.email = data.email || null;
  }

  return prisma.patient.update({
    where: { id },
    data: updateData
  });
};

export const deletePatient = async (id) => {
  return prisma.patient.delete({
    where: { id }
  });
};

const generatePatientNumber = async () => {
  const year = new Date().getFullYear();

  const count = await prisma.patient.count();

  const nextNumber = String(count + 1).padStart(6, "0");

  return `MED-${year}-${nextNumber}`;
};