import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE SERVICE
|--------------------------------------------------------------------------
*/

export const createService = async ({
  code,
  name,
  description,
  category,
  departmentId,
}) => {
  if (!code) {
    const error = new Error("Service code is required");
    error.statusCode = 400;
    throw error;
  }

  if (!name) {
    const error = new Error("Service name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!category) {
    const error = new Error("Service category is required");
    error.statusCode = 400;
    throw error;
  }

  if (!departmentId) {
    const error = new Error("departmentId is required");
    error.statusCode = 400;
    throw error;
  }

  const department = await prisma.department.findUnique({
    where: {
      id: departmentId,
    },
  });

  if (!department) {
    const error = new Error("Department not found");
    error.statusCode = 404;
    throw error;
  }

  if (!department.isActive) {
    const error = new Error(
      "Cannot create a service under an inactive department"
    );

    error.statusCode = 409;
    throw error;
  }

  const existing = await prisma.service.findUnique({
    where: {
      code,
    },
  });

  if (existing) {
    const error = new Error(
      "A service with this code already exists"
    );

    error.statusCode = 409;
    throw error;
  }

  return prisma.service.create({
    data: {
      code,
      name,
      description: description || null,
      category,
      departmentId,
    },

    include: {
      department: true,

      prices: {
        orderBy: {
          effectiveFrom: "desc",
        },
      },
    },
  });
};


/*
|--------------------------------------------------------------------------
| GET SERVICES
|--------------------------------------------------------------------------
*/

export const getServices = async ({
  departmentId,
  category,
  includeInactive = false,
} = {}) => {
  return prisma.service.findMany({
    where: {
      ...(departmentId && {
        departmentId,
      }),

      ...(category && {
        category,
      }),

      ...(includeInactive
        ? {}
        : {
            isActive: true,
          }),
    },

    include: {
      department: true,

      prices: {
        where: includeInactive
          ? {}
          : {
              isActive: true,
            },

        orderBy: {
          effectiveFrom: "desc",
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
| GET SERVICE BY ID
|--------------------------------------------------------------------------
*/

export const getServiceById = async (
  serviceId
) => {
  const service = await prisma.service.findUnique({
    where: {
      id: serviceId,
    },

    include: {
      department: true,

      prices: {
        orderBy: {
          effectiveFrom: "desc",
        },
      },
    },
  });

  if (!service) {
    const error = new Error("Service not found");
    error.statusCode = 404;
    throw error;
  }

  return service;
};


/*
|--------------------------------------------------------------------------
| UPDATE SERVICE
|--------------------------------------------------------------------------
*/

export const updateService = async (
  serviceId,
  {
    code,
    name,
    description,
    category,
    departmentId,
    isActive,
  }
) => {
  const existing = await prisma.service.findUnique({
    where: {
      id: serviceId,
    },
  });

  if (!existing) {
    const error = new Error("Service not found");
    error.statusCode = 404;
    throw error;
  }

  if (code && code !== existing.code) {
    const duplicate = await prisma.service.findUnique({
      where: {
        code,
      },
    });

    if (duplicate) {
      const error = new Error(
        "Service code already exists"
      );

      error.statusCode = 409;
      throw error;
    }
  }

  if (departmentId) {
    const department =
      await prisma.department.findUnique({
        where: {
          id: departmentId,
        },
      });

    if (!department) {
      const error = new Error(
        "Department not found"
      );

      error.statusCode = 404;
      throw error;
    }

    if (!department.isActive) {
      const error = new Error(
        "Cannot move service to an inactive department"
      );

      error.statusCode = 409;
      throw error;
    }
  }

  return prisma.service.update({
    where: {
      id: serviceId,
    },

    data: {
      ...(code !== undefined && { code }),
      ...(name !== undefined && { name }),
      ...(description !== undefined && {
        description,
      }),
      ...(category !== undefined && {
        category,
      }),
      ...(departmentId !== undefined && {
        departmentId,
      }),
      ...(isActive !== undefined && {
        isActive,
      }),
    },

    include: {
      department: true,
      prices: true,
    },
  });
};


/*
|--------------------------------------------------------------------------
| DEACTIVATE SERVICE
|--------------------------------------------------------------------------
*/

export const deactivateService = async (
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

  return prisma.service.update({
    where: {
      id: serviceId,
    },

    data: {
      isActive: false,
    },
  });
};