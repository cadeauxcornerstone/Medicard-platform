import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| INSURANCE PROVIDERS
|--------------------------------------------------------------------------
*/

export const createInsuranceProvider = async ({
  name,
  code,
  phone,
  email,
}) => {
  if (!name) {
    const error = new Error("Insurance provider name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!code) {
    const error = new Error("Insurance provider code is required");
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.insuranceProvider.findUnique({
    where: { code },
  });

  if (existing) {
    const error = new Error(
      "Insurance provider code already exists"
    );
    error.statusCode = 409;
    throw error;
  }

  return prisma.insuranceProvider.create({
    data: {
      name,
      code,
      phone: phone || null,
      email: email || null,
    },
  });
};


export const getInsuranceProviders = async () => {
  return prisma.insuranceProvider.findMany({
    include: {
      plans: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};


/*
|--------------------------------------------------------------------------
| INSURANCE PLANS
|--------------------------------------------------------------------------
*/

export const createInsurancePlan = async ({
  providerId,
  name,
  code,
}) => {
  if (!providerId) {
    const error = new Error("providerId is required");
    error.statusCode = 400;
    throw error;
  }

  if (!name) {
    const error = new Error("Insurance plan name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!code) {
    const error = new Error("Insurance plan code is required");
    error.statusCode = 400;
    throw error;
  }

  const provider =
    await prisma.insuranceProvider.findUnique({
      where: {
        id: providerId,
      },
    });

  if (!provider) {
    const error = new Error(
      "Insurance provider not found"
    );
    error.statusCode = 404;
    throw error;
  }

  if (!provider.isActive) {
    const error = new Error(
      "Insurance provider is inactive"
    );
    error.statusCode = 409;
    throw error;
  }

  const existing =
    await prisma.insurancePlan.findUnique({
      where: {
        code,
      },
    });

  if (existing) {
    const error = new Error(
      "Insurance plan code already exists"
    );
    error.statusCode = 409;
    throw error;
  }

  return prisma.insurancePlan.create({
    data: {
      providerId,
      name,
      code,
    },

    include: {
      provider: true,
      coverages: true,
    },
  });
};


export const getInsurancePlans = async () => {
  return prisma.insurancePlan.findMany({
    include: {
      provider: true,
      coverages: {
        include: {
          service: true,
        },
      },
    },

    orderBy: {
      name: "asc",
    },
  });
};


/*
|--------------------------------------------------------------------------
| COVERAGE RULES
|--------------------------------------------------------------------------
*/

export const createCoverage = async ({
  planId,
  serviceId,
  coverageType,
  coverageValue,
  maxAmount,
}) => {
  if (!planId) {
    const error = new Error("planId is required");
    error.statusCode = 400;
    throw error;
  }

  if (!serviceId) {
    const error = new Error("serviceId is required");
    error.statusCode = 400;
    throw error;
  }

  if (!coverageType) {
    const error = new Error("coverageType is required");
    error.statusCode = 400;
    throw error;
  }

  if (
    coverageType !== "PERCENTAGE" &&
    coverageType !== "FIXED_AMOUNT"
  ) {
    const error = new Error(
      "coverageType must be PERCENTAGE or FIXED_AMOUNT"
    );
    error.statusCode = 400;
    throw error;
  }

  const numericCoverage = Number(coverageValue);

  if (
    !Number.isFinite(numericCoverage) ||
    numericCoverage < 0
  ) {
    const error = new Error(
      "coverageValue must be a valid non-negative number"
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    coverageType === "PERCENTAGE" &&
    numericCoverage > 100
  ) {
    const error = new Error(
      "Percentage coverage cannot exceed 100"
    );
    error.statusCode = 400;
    throw error;
  }

  const plan =
    await prisma.insurancePlan.findUnique({
      where: {
        id: planId,
      },
    });

  if (!plan) {
    const error = new Error(
      "Insurance plan not found"
    );
    error.statusCode = 404;
    throw error;
  }

  const service =
    await prisma.service.findUnique({
      where: {
        id: serviceId,
      },
    });

  if (!service) {
    const error = new Error(
      "Service not found"
    );
    error.statusCode = 404;
    throw error;
  }

  const existing =
    await prisma.insuranceCoverage.findUnique({
      where: {
        planId_serviceId: {
          planId,
          serviceId,
        },
      },
    });

  if (existing) {
    const error = new Error(
      "Coverage rule already exists for this service"
    );
    error.statusCode = 409;
    throw error;
  }

  let numericMaxAmount = null;

  if (maxAmount !== undefined && maxAmount !== null) {
    numericMaxAmount = Number(maxAmount);

    if (
      !Number.isFinite(numericMaxAmount) ||
      numericMaxAmount < 0
    ) {
      const error = new Error(
        "maxAmount must be a valid non-negative number"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  return prisma.insuranceCoverage.create({
    data: {
      planId,
      serviceId,
      coverageType,
      coverageValue: numericCoverage,
      maxAmount: numericMaxAmount,
    },

    include: {
      plan: true,
      service: {
        include: {
          department: true,
        },
      },
    },
  });
};


export const getCoveragesByPlan = async (
  planId
) => {
  const plan =
    await prisma.insurancePlan.findUnique({
      where: {
        id: planId,
      },
    });

  if (!plan) {
    const error = new Error(
      "Insurance plan not found"
    );
    error.statusCode = 404;
    throw error;
  }

  return prisma.insuranceCoverage.findMany({
    where: {
      planId,
    },

    include: {
      service: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};


/*
|--------------------------------------------------------------------------
| PATIENT INSURANCE
|--------------------------------------------------------------------------
*/

export const addPatientInsurance = async ({
  patientId,
  planId,
  membershipNumber,
  validFrom,
  validTo,
}) => {
  if (!patientId) {
    const error = new Error("patientId is required");
    error.statusCode = 400;
    throw error;
  }

  if (!planId) {
    const error = new Error("planId is required");
    error.statusCode = 400;
    throw error;
  }

  if (!membershipNumber) {
    const error = new Error(
      "membershipNumber is required"
    );
    error.statusCode = 400;
    throw error;
  }

  const patient =
    await prisma.patient.findUnique({
      where: {
        id: patientId,
      },
    });

  if (!patient) {
    const error = new Error("Patient not found");
    error.statusCode = 404;
    throw error;
  }

  const plan =
    await prisma.insurancePlan.findUnique({
      where: {
        id: planId,
      },
    });

  if (!plan) {
    const error = new Error(
      "Insurance plan not found"
    );
    error.statusCode = 404;
    throw error;
  }

  const existing =
    await prisma.patientInsurance.findFirst({
      where: {
        patientId,
        planId,
        status: "ACTIVE",
      },
    });

  if (existing) {
    const error = new Error(
      "Patient already has an active insurance record for this plan"
    );
    error.statusCode = 409;
    throw error;
  }

  return prisma.patientInsurance.create({
    data: {
      patientId,
      planId,
      membershipNumber,
      validFrom: validFrom
        ? new Date(validFrom)
        : null,
      validTo: validTo
        ? new Date(validTo)
        : null,
    },

    include: {
      plan: {
        include: {
          provider: true,
        },
      },
      patient: true,
    },
  });
};


export const getPatientInsurance = async (
  patientId
) => {
  const patient =
    await prisma.patient.findUnique({
      where: {
        id: patientId,
      },
    });

  if (!patient) {
    const error = new Error("Patient not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.patientInsurance.findMany({
    where: {
      patientId,
    },

    include: {
      plan: {
        include: {
          provider: true,
          coverages: {
            include: {
              service: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};