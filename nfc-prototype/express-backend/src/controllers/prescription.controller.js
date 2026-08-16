import {
  createPrescription,
  getPrescriptionsByEncounter,
  getPrescriptionById,
  updatePrescriptionStatus,
} from "../services/prescription.service.js";

/*
|--------------------------------------------------------------------------
| CREATE PRESCRIPTION
|--------------------------------------------------------------------------
*/

export const create = async (req, res, next) => {
  try {
    const {
      patientId,
      notes,
      items,
    } = req.body;

    const encounterId =
      req.params.encounterId;

    // Development fallback.
    // Later this comes from authenticated req.user.
    const prescribedById =
      req.user?.id ||
      req.body.prescribedById;

    if (!prescribedById) {
      return res.status(401).json({
        success: false,
        message:
          "Prescribing provider is required",
      });
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message:
          "patientId is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one medication is required",
      });
    }

    const prescription =
      await createPrescription({
        encounterId,
        patientId,
        prescribedById,
        notes,
        items,
      });

    res.status(201).json({
      success: true,
      message:
        "Prescription created successfully",
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET PRESCRIPTIONS FOR ENCOUNTER
|--------------------------------------------------------------------------
*/

export const getByEncounter = async (
  req,
  res,
  next
) => {
  try {
    const prescriptions =
      await getPrescriptionsByEncounter(
        req.params.encounterId
      );

    res.json({
      success: true,
      data: prescriptions,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET ONE PRESCRIPTION
|--------------------------------------------------------------------------
*/

export const getById = async (
  req,
  res,
  next
) => {
  try {
    const prescription =
      await getPrescriptionById(
        req.params.prescriptionId
      );

    res.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE PRESCRIPTION STATUS
|--------------------------------------------------------------------------
*/

export const updateStatus = async (
  req,
  res,
  next
) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const prescription =
      await updatePrescriptionStatus(
        req.params.prescriptionId,
        status
      );

    res.json({
      success: true,
      message:
        "Prescription status updated successfully",
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};