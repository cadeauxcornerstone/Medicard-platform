import {
  createCharge,
  getChargesByEncounter,
  getChargeById,
} from "../services/charge.service.js";

/*
|--------------------------------------------------------------------------
| CREATE CHARGE
|--------------------------------------------------------------------------
*/

export const create = async (
  req,
  res,
  next
) => {
  try {
    const {
      patientId,
      serviceId,
      quantity,
      description,
    } = req.body;

    const encounterId =
      req.params.encounterId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message:
          "patientId is required",
      });
    }

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message:
          "serviceId is required",
      });
    }

    const charge =
      await createCharge({
        patientId,
        encounterId,
        serviceId,
        quantity,
        description,
      });

    res.status(201).json({
      success: true,
      message:
        "Charge created successfully",
      data: charge,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET CHARGES FOR ENCOUNTER
|--------------------------------------------------------------------------
*/

export const getByEncounter =
  async (
    req,
    res,
    next
  ) => {
    try {
      const charges =
        await getChargesByEncounter(
          req.params.encounterId
        );

      res.json({
        success: true,
        data: charges,
      });
    } catch (error) {
      next(error);
    }
  };


/*
|--------------------------------------------------------------------------
| GET CHARGE
|--------------------------------------------------------------------------
*/

export const getById = async (
  req,
  res,
  next
) => {
  try {
    const charge =
      await getChargeById(
        req.params.chargeId
      );

    res.json({
      success: true,
      data: charge,
    });
  } catch (error) {
    next(error);
  }
};