import prisma from "../config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE DEPARTMENT
|--------------------------------------------------------------------------
*/

export const createDepartment = async ({
  name,
  code,
  type,
  description,
}) => {
  if (!name) {
    const error = new Error("Department name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!code) {
    const error = new Error("Department code is required");
    error.statusCode = 400;
    throw error;
  }

  if (!type) {
    const error = new Error("Department type is required");
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.department.findFirst({
    where: {
      OR: [
        { code },
        { name },
      ],
    },
  });

  if (existing) {
    const error = new Error(
      "A department with this name or code already exists"
    );

    error.statusCode = 409;
    throw error;
  }

  return prisma.department.create({
    data: {
      name,
      code,
      type,
      description: description || null,
    },

    include: {
      services: {
        include: {
          prices: true,
        },
      },
    },
  });
};


/*
|--------------------------------------------------------------------------
| GET ALL DEPARTMENTS
|--------------------------------------------------------------------------
*/

export const getDepartments = async ({
  includeInactive = false,
} = {}) => {
  return prisma.department.findMany({
    where: includeInactive
      ? {}
      : {
          isActive: true,
        },

    include: {
      services: {
        where: {
          isActive: true,
        },

        include: {
          prices: {
            where: {
              isActive: true,
            },

            orderBy: {
              effectiveFrom: "desc",
            },
          },
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
| GET ONE DEPARTMENT
|--------------------------------------------------------------------------
*/

export const getDepartmentById = async (
  departmentId
) => {
  const department =
    await prisma.department.findUnique({
      where: {
        id: departmentId,
      },

      include: {
        services: {
          include: {
            prices: {
              orderBy: {
                effectiveFrom: "desc",
              },
            },
          },
        },
      },
    });

  if (!department) {
    const error = new Error(
      "Department not found"
    );

    error.statusCode = 404;
    throw error;
  }

  return department;
};


/*
|--------------------------------------------------------------------------
| UPDATE DEPARTMENT
|--------------------------------------------------------------------------
*/

export const updateDepartment = async (
  departmentId,
  {
    name,
    code,
    type,
    description,
    isActive,
  }
) => {
  const existing =
    await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
    });

  if (!existing) {
    const error = new Error(
      "Department not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (code && code !== existing.code) {
    const duplicate =
      await prisma.department.findUnique({
        where: {
          code,
        },
      });

    if (duplicate) {
      const error = new Error(
        "Department code already exists"
      );

      error.statusCode = 409;
      throw error;
    }
  }

  return prisma.department.update({
    where: {
      id: departmentId,
    },

    data: {
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code }),
      ...(type !== undefined && { type }),
      ...(description !== undefined && {
        description,
      }),
      ...(isActive !== undefined && {
        isActive,
      }),
    },

    include: {
      services: true,
    },
  });
};


/*
|--------------------------------------------------------------------------
| DEACTIVATE DEPARTMENT
|--------------------------------------------------------------------------
*/

export const deactivateDepartment = async (
  departmentId
) => {
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

  return prisma.department.update({
    where: {
      id: departmentId,
    },

    data: {
      isActive: false,
    },
  });
};