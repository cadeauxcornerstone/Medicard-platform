import {
  dispensePrescription,
  getDispensingRecordsByPrescription,
} from "../services/dispensing.service.js";

/*
|--------------------------------------------------------------------------
| DISPENSE PRESCRIPTION
|--------------------------------------------------------------------------
*/

export const dispense = async (
  req,
  res,
  next
) => {
  try {
    const prescriptionId =
      req.params.prescriptionId;

    /*
    |--------------------------------------------------------------------------
    | Development fallback
    |--------------------------------------------------------------------------
    |
    | Later this comes from authenticated req.user.
    |
    */

    const dispensedById =
      req.user?.id ||
      req.body.dispensedById;

    const {
      facilityId,
      items,
      notes,
    } = req.body;

    if (!dispensedById) {
      return res.status(401).json({
        success: false,
        message:
          "Dispensing pharmacist is required",
      });
    }

    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message:
          "Facility ID is required",
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one dispensing item is required",
      });
    }

    const result =
      await dispensePrescription({
        prescriptionId,
        dispensedById,
        facilityId,
        items,
        notes,
      });

    res.status(201).json({
      success: true,
      message:
        "Prescription dispensed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET DISPENSING HISTORY
|--------------------------------------------------------------------------
*/

export const getByPrescription =
  async (
    req,
    res,
    next
  ) => {
    try {
      const records =
        await getDispensingRecordsByPrescription(
          req.params.prescriptionId
        );

      res.json({
        success: true,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  };