import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deactivateDepartment,
} from "../services/department.service.js";

/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/

export const create = async (
  req,
  res,
  next
) => {
  try {
    const {
      name,
      code,
      type,
      description,
    } = req.body;

    const department =
      await createDepartment({
        name,
        code,
        type,
        description,
      });

    res.status(201).json({
      success: true,
      message:
        "Department created successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET ALL
|--------------------------------------------------------------------------
*/

export const getAll = async (
  req,
  res,
  next
) => {
  try {
    const includeInactive =
      req.query.includeInactive === "true";

    const departments =
      await getDepartments({
        includeInactive,
      });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET ONE
|--------------------------------------------------------------------------
*/

export const getById = async (
  req,
  res,
  next
) => {
  try {
    const department =
      await getDepartmentById(
        req.params.departmentId
      );

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
*/

export const update = async (
  req,
  res,
  next
) => {
  try {
    const department =
      await updateDepartment(
        req.params.departmentId,
        req.body
      );

    res.json({
      success: true,
      message:
        "Department updated successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| DEACTIVATE
|--------------------------------------------------------------------------
*/

export const deactivate = async (
  req,
  res,
  next
) => {
  try {
    const department =
      await deactivateDepartment(
        req.params.departmentId
      );

    res.json({
      success: true,
      message:
        "Department deactivated successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};