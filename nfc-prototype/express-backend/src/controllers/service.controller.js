import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deactivateService,
} from "../services/service.service.js";

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
      code,
      name,
      description,
      category,
      departmentId,
    } = req.body;

    const service = await createService({
      code,
      name,
      description,
      category,
      departmentId,
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
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
    const {
      departmentId,
      category,
      includeInactive,
    } = req.query;

    const services = await getServices({
      departmentId,
      category,
      includeInactive:
        includeInactive === "true",
    });

    res.json({
      success: true,
      data: services,
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
    const service =
      await getServiceById(
        req.params.serviceId
      );

    res.json({
      success: true,
      data: service,
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
    const service =
      await updateService(
        req.params.serviceId,
        req.body
      );

    res.json({
      success: true,
      message: "Service updated successfully",
      data: service,
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
    const service =
      await deactivateService(
        req.params.serviceId
      );

    res.json({
      success: true,
      message:
        "Service deactivated successfully",
      data: service,
    });
  } catch (error) {
    next(error);
  }
};