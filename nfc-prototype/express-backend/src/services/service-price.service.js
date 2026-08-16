import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE SERVICE PRICE
|--------------------------------------------------------------------------
*/

export const createServicePrice = async ({
  serviceId,
  amount,
  currency = "RWF",
  effectiveFrom,
  effectiveTo,
}) => {
  if (!serviceId) {
    const error = new Error("serviceId is required");
    error.statusCode = 400;
    throw error;
  }

  if (amount === undefined || amount === null) {
    const error = new Error("amount is required");
    error.statusCode = 400;
    throw error;
  }

  const numericAmount = Number(amount);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount < 0
  ) {
    const error = new Error(
      "amount must be a valid non-negative number"
    );
    error.statusCode = 400;
    throw error;
  }

  const service = await prisma.service.findUnique({
    where: {
      id: serviceId,
    },
  });

  if (!service) {
    const error = new Error("Service not found");
    error.statusCode = 404;
    throw error;
  }

  if (!service.isActive) {
    const error = new Error(
      "Cannot add a price to an inactive service"
    );
    error.statusCode = 409;
    throw error;
  }

  const startDate = effectiveFrom
    ? new Date(effectiveFrom)
    : new Date();

  if (Number.isNaN(startDate.getTime())) {
    const error = new Error(
      "Invalid effectiveFrom date"
    );
    error.statusCode = 400;
    throw error;
  }

  let endDate = null;

  if (effectiveTo) {
    endDate = new Date(effectiveTo);

    if (Number.isNaN(endDate.getTime())) {
      const error = new Error(
        "Invalid effectiveTo date"
      );
      error.statusCode = 400;
      throw error;
    }

    if (endDate <= startDate) {
      const error = new Error(
        "effectiveTo must be after effectiveFrom"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Close currently active price
  |--------------------------------------------------------------------------
  |
  | We don't delete the old price.
  | We preserve it for historical billing.
  |
  */

  await prisma.servicePrice.updateMany({
    where: {
      serviceId,
      isActive: true,
    },

    data: {
      isActive: false,
      effectiveTo: startDate,
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Create new price
  |--------------------------------------------------------------------------
  */

  return prisma.servicePrice.create({
    data: {
      serviceId,

      amount: numericAmount,

      currency,

      effectiveFrom: startDate,

      effectiveTo: endDate,

      isActive: true,
    },

    include: {
      service: {
        include: {
          department: true,
        },
      },
    },
  });
};


/*
|--------------------------------------------------------------------------
| GET ALL PRICES FOR SERVICE
|--------------------------------------------------------------------------
*/

export const getServicePrices = async (
  serviceId
) => {
  const service = await prisma.service.findUnique({
    where: {
      id: serviceId,
    },
  });

  if (!service) {
    const error = new Error("Service not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.servicePrice.findMany({
    where: {
      serviceId,
    },

    orderBy: {
      effectiveFrom: "desc",
    },
  });
};


/*
|--------------------------------------------------------------------------
| GET CURRENT PRICE
|--------------------------------------------------------------------------
*/

export const getCurrentServicePrice = async (
  serviceId
) => {
  const service = await prisma.service.findUnique({
    where: {
      id: serviceId,
    },
  });

  if (!service) {
    const error = new Error("Service not found");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();

  const price = await prisma.servicePrice.findFirst({
    where: {
      serviceId,

      isActive: true,

      effectiveFrom: {
        lte: now,
      },

      OR: [
        {
          effectiveTo: null,
        },
        {
          effectiveTo: {
            gt: now,
          },
        },
      ],
    },

    orderBy: {
      effectiveFrom: "desc",
    },
  });

  if (!price) {
    const error = new Error(
      "No active price found for this service"
    );

    error.statusCode = 404;
    throw error;
  }

  return price;
};


/*
|--------------------------------------------------------------------------
| DEACTIVATE PRICE
|--------------------------------------------------------------------------
*/

export const deactivateServicePrice = async (
  priceId
) => {
  const price =
    await prisma.servicePrice.findUnique({
      where: {
        id: priceId,
      },
    });

  if (!price) {
    const error = new Error(
      "Service price not found"
    );

    error.statusCode = 404;
    throw error;
  }

  return prisma.servicePrice.update({
    where: {
      id: priceId,
    },

    data: {
      isActive: false,

      effectiveTo:
        price.effectiveTo || new Date(),
    },

    include: {
      service: true,
    },
  });
};